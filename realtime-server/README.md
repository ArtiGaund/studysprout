# StudySprout Realtime Server ⚡

> The real-time collaboration backbone for [StudySprout](https://studysprouts.in/) — Socket.io + Yjs powered live editing, presence, and generation locking.

[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-realtime-010101?logo=socket.io)](https://socket.io/)
[![Yjs](https://img.shields.io/badge/Yjs-CRDT-yellow)](https://github.com/yjs/yjs)

**Live app this powers:** [studysprouts.in](https://studysprouts.in/)
**Main repo:** [`studysprout`](https://github.com/ArtiGaund/studysprout) — the Next.js app, API routes, and background workers this server communicates with
**This repo:** `github.com/ArtiGaund/studysprout-realtime-server` *(replace with your actual URL)*

---

## What This Service Does

This is a standalone Express + Socket.io server, deployed independently from the main StudySprout app, responsible for everything that needs a persistent, always-on connection:

1. **Real-time presence** — who's currently in a workspace, who's currently in a specific file
2. **Collaborative document editing** — Yjs CRDT sync over WebSockets, so multiple users can edit the same file simultaneously with zero conflicts
3. **AI generation locking** — prevents two users from triggering flashcard generation for the same resource at once
4. **Title-editing presence** — prevents two users from renaming the same folder/file/flashcard set at the same time
5. **Cross-service event relay** — receives HTTP calls from the main Next.js app and the background worker, and re-broadcasts them to connected browser clients as live socket events

It exists as a separate deployment because a serverless platform (Vercel, where the main app runs) cannot host a long-running process that keeps WebSocket connections open — this server has to stay alive continuously, which is why it's deployed on Render instead.

---

## Why This Is a Separate Repo/Service

| | Main app (`studysprout`, Vercel) | This server (Render) |
|---|---|---|
| Execution model | Request/response, serverless | Long-running process |
| Can hold open WebSocket connections | No | Yes |
| Deployment | Vercel | Render |

Vercel functions spin up per-request and get frozen/killed between invocations — a Socket.io server needs to sit and hold thousands of open connections continuously, which is structurally incompatible with that model. Render gives it a normal, always-on container instead.

---

## Architecture

### Connection to the main app and worker

```
┌─────────────────────┐                    ┌──────────────────────  ┐
│  Browser (client)   │◄──── WebSocket ──► │  This server           │
│  Yjs doc + Socket.io│                    │  Socket.io + Yjs mirror│
└─────────────────────┘                    └──────────┬─────────────┘
                                                      │
                          ┌───────────────────────────┼───────────────────────┐
                          │                           │                       │
                    HTTP POST                    enqueue job                emit HTTP
                    /emit/* endpoints            (file-sync-queue)          calls received
                          │                              │                   from worker
                          ▼                              ▼                       │
              ┌─────────────────────┐         ┌───────────────────┐              │
              │  Next.js API routes │         │   Shared Redis    │              │
              │  (main repo, Vercel)│         │   (BullMQ)        │◄─────────────┘
              └─────────────────────┘         └─────────┬─────────┘
                                                        │ consumed by
                                                        ▼
                                              ┌─────────────────────────┐
                                              │  Background workers     │
                                              │  (main repo, Railway)   │
                                              │  writes to MongoDB      │
                                              └─────────────────────────┘
```

**Three distinct communication paths this server participates in:**

1. **Browser ↔ this server (WebSocket)** — live Yjs document updates, presence, awareness (cursors), generation lock requests
2. **This server → Redis (BullMQ)** — Yjs edits are debounced 2 seconds, then enqueued as `persist-file` jobs onto the shared `file-sync-queue`; the main repo's background worker consumes these and writes the final state to MongoDB
3. **Main repo (API routes + worker) → this server (HTTP)** — both the Next.js API routes and the background worker make outbound POST calls to this server's `/emit/*` endpoints whenever something needs to be pushed live to connected browsers (a new file finishing PDF processing, a flashcard set completing, a workspace invitation arriving)

This server never calls anything in the main repo directly — it only *receives* HTTP calls from it, and *sends* jobs to the shared queue. There's no reverse dependency.

Separately, the main repo's flashcard-generation route calls the standalone [`rate-limiter`](https://github.com/ArtiGaund/rate-limiter) Java service (also on Render) before making a Gemini API call — this server is not involved in that check.


---

## Core Mechanisms

### 1. Socket Authentication

Every socket connection is authenticated by decoding the same NextAuth JWT the main app issues:

```typescript
const decoded = await decode({ token, secret: config.NEXTAUTH_SECRET! });
socket.data.user = decoded;
```

**Critical requirement**: `NEXTAUTH_SECRET` on this service must be byte-identical to the one set on the main app (Vercel). If they differ even slightly, sockets still connect (this middleware allows unauthenticated connections through rather than rejecting them outright) but silently never join their personal notification room — meaning targeted events like workspace invitations arrive only on page refresh, never live. This is the single most common cause of "sockets work but this one feature doesn't."

### 2. Presence Tracking (two separate layers)

- **Workspace presence** — `workspaceId → userId → Set<socketId>` — tracks who's active anywhere in a workspace, supports multiple tabs per user without flickering
- **File presence** — `fileId → userId → { username, avatarUrl, sockets }` — tracks who's actively viewing/editing a specific file, broadcast to everyone else in that file's room

### 3. Yjs Collaborative Editing

The server keeps an in-memory "mirror" `Y.Doc` per active file. When a client sends a raw Yjs update:

```typescript
socket.on("file:update-raw", ({ fileId, update }) => {
  socket.to(`file:${fileId}`).emit("file:update-raw", update);  // live relay
  Y.applyUpdate(doc, new Uint8Array(update));                    // update server mirror
  // debounce 2s, then enqueue a persist-file job to Redis
});
```

Updates are relayed to other connected clients instantly, and independently debounced before being persisted to MongoDB — so typing doesn't hit the database on every keystroke, but the live experience stays instant. Awareness updates (cursor positions, user color) are relayed via `socket.volatile` — best-effort, no delivery guarantee, since losing an occasional cursor-position packet doesn't matter.

### 4. AI Generation Locks (hierarchical)

Prevents duplicate/conflicting flashcard generation:

```typescript
socket.on("request_gen_start", ({ resourceId, parentId, workspaceId }) => {
  // 1. Is this exact resource already locked?
  // 2. Is the parent folder currently generating? (blocks child-file generation)
  // 3. Is any child file currently generating? (blocks folder-level generation)
  // → grant or deny the lock accordingly
});
```

Locks auto-release after 5 minutes as a safety net in case a client disconnects mid-generation ("ghost lock protection"), and every lock state change is broadcast to the whole workspace so progress bars stay in sync for everyone watching.

Note: this lock prevents *concurrent* generation of the same resource. It's a separate concern from the rate limiter, which prevents *repeated* generation requests over time regardless of concurrency — see the main [`studysprout`](https://github.com/ArtiGaund/studysprout) README for that mechanism.

### 5. Title-Editing Presence

A lightweight three-event flow (`start` / `typing` / `stop`) broadcasts when someone begins editing a folder/file/flashcard set's title, so other clients can show "someone's renaming this" rather than two people racing to submit conflicting names.

### 6. HTTP Emit Endpoints (`/emit/*`)

A set of internal-only POST endpoints that the main app's API routes and background workers call to push events live to connected browsers — covering workspace tree updates, member changes, flashcard set lifecycle events (created/updated/regenerated/outdated), file stats updates, activity feed entries, and workspace invitations/responses. These are what let a background worker (which has no WebSocket connection of its own) still cause an instant UI update in someone's browser.

---

## Tech Stack

- Express (HTTP server + `/emit/*` endpoints)
- Socket.io (WebSocket layer)
- Yjs (CRDT document sync)
- BullMQ + ioredis (job queue producer for `file-sync-queue`)
- `next-auth/jwt` (shared JWT decoding with the main app)
- CORS configured to only accept requests from the main app's deployed origin

---

## Environment Variables

```bash
REDIS_URL=...                         # same Redis instance the main repo's worker consumes
NEXTAUTH_SECRET=...                   # must exactly match the main app's value
NEXT_PUBLIC_APP_URL=https://studysprouts.vercel.app   # for CORS
PORT=...                              # Railway assigns this dynamically — read from process.env.PORT, don't hardcode
```

---

## Getting Started

```bash
git clone https://github.com/YOUR-USERNAME/studysprout-realtime-server.git
cd studysprout-realtime-server
npm install
npm run dev
```

Runs on `http://localhost:4000` by default. You'll also want the [main `studysprout` repo](https://github.com/YOUR-USERNAME/studysprout) running locally, with its `NEXT_PUBLIC_REALTIME_URL` pointed at this server, for the full app to function.

---

## Deployment

Deployed as submodule of Studysprout on Railway (Nixpacks auto-detects the Node.js app, no Docker required):

1. Render → New Web Service → Deploy from GitHub → select this repo
2. Set environment variables (above) in Railway's Variables tab
3. Ensure `PORT` is read dynamically (`process.env.PORT`), not hardcoded — Railway assigns it at runtime

---

## What I Learned Building This

- Designing a socket authentication layer that shares a JWT secret across two independently deployed services, and the subtle, silent failure mode when that secret drifts out of sync
- Building real concurrency primitives for multi-user collaboration — not just "relay events," but actual locking logic with hierarchical checks and crash-safety timeouts
- The debounce-then-queue pattern for persisting high-frequency live edits without hammering the database on every keystroke
- Debugging a Yjs echo-back bug where a client resending its own hydrated document state as a live delta corrupted merged state for other clients — traced to a single redundant emit call in the editor's hydration effect
- Coordinating a shared Redis connection format (`REDIS_URL`) across services that originally used inconsistent connection configs (separate host/port vars vs. a single URL)

---

## Related

- **Main application**: [`studysprout`](https://github.com/ArtiGaund/studysprout) — Next.js app, API routes, background workers, PDF pipeline, concept graph, flashcards
- **Rate limiter**: [`rate-limiter`](https://github.com/ArtiGaund/rate-limiter) — standalone Java service rate-limiting Gemini API calls
- **Live demo**: [studysprouts.vercel.app](https://studysprouts.vercel.app)

## License
This project is not open source. The code is publicly viewable for portfolio 
purposes, but all rights are reserved — please do not copy, reuse, or 
redistribute without permission.

## Contact
**Your Name** — [LinkedIn](https://linkedin.com/in/artigaund) · [Email](mailto:artigaund2210@gmail.com)
