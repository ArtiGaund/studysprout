/**
 * Realtime Collaboration Server (Studysprout)
 * -------------------------------------------
 * This server manages:
 * 1. Real-time Presence (Who is in which workspace/file)
 * 2. Shared Document Editing (Yjs + Websockets)
 * 3. AI Generation Locks (Preventing concurrent LLM calls)
 * 4. Cross-tab synchronization via Redis/BullMQ
*/

import express from "express";
import http from "http";
import { Server } from "socket.io";
import "dotenv/config";
import config from "./config/config";
import { decode } from "next-auth/jwt";
import cors from "cors";
import { ConnectionOptions, Queue, QueueEvents } from "bullmq";
import * as Y from "yjs";
import Redis, { RedisOptions } from "ioredis";

/**
 * ----HTTP server (socket.io attaches to this)----
 */
const app = express();
// Standard JSON payload (Worker uses)
app.use(express.json({ limit: '50mb'}));
// For form-encoded data
app.use(express.urlencoded({ limit: '50mb', extended: true }));
/**
 * INTERNAL API ENDPOINTS
 * Allows the Next.js backend to trigger socket events (e.g. tree updates, member changes)
 */
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  methods: [ "GET", "POST"],
  credentials: true,
}));
app.use(express.json());

// Health check for uptime monitoring
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const server = http.createServer(app);

const redisUrl = new URL(process.env.REDIS_URL || "redis://localhost:6379");
/** * REDIS CONFIGURATION
 * BullMQ requires Redis to manage background jobs like persisting Yjs docs to the main DB
 */ 
const redisConnection: RedisOptions = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || "6379"),
  password: redisUrl.password || undefined,
  tls: redisUrl.protocol === "rediss:" ? {} : undefined, // Upstash needs this
  maxRetriesPerRequest: null,
  keepAlive: 10000, //send keepalive every 10s
  retryStrategy(times: number){
    return Math.min(times * 200, 5000);
  },
}
const redisClient = new Redis(redisConnection);

redisClient.on('error', (err) => {
  console.error("[redis] connection error (auto-reconnecting): ",err.message);
});

// Keep the connection warm so Upstash doesn't idle-close it
setInterval(() => {
  redisClient.ping().catch(() => {});
}, 20000);

/** *IN_MEMORY STATE
 * docs: Current Yjs document for live editing
 * saveTimers: Debouncing logic to prevent hitting the database on every keystroke
*/
const docs = new Map<string, Y.Doc>();
const saveTimers = new Map<string, NodeJS.Timeout>();

// Queue for pushing file updates back to the Next.js main database
const fileSyncQueue = new Queue("file-sync-queue", { 
  connection: redisClient as any
});

const fileSyncQueueEvents = new QueueEvents("file-sync-queue", {
  connection: redisClient as any
});

/**
 * ---- Initialize socket.io ----
 */
const io = new Server(server, {
    cors: { 
      origin: [
        "https://studysprouts.vercel.app",
        "http://localhost:3000"
      ],
      credentials: true,
    }, //allow frontend connections 
})

// --- Presence Maps ----
/** Workspace Presence
 * workspaceId -> userId -> Set of socketIds
 * Using a Set for sockets allows a single user to have multiple tabs open without flickering
 */ 
const workspacePresence = new Map<
  string,  //workspaceId
  Map<
    string, //userId
    Set<string> //socketIds
  >
>();

  /** File Presence
 * fileId -> userId -> user data (for avatar/cursor presence)
 */
const activeFileUsers = new Map<
  string, //fileId
  Map<string, {
    userId: string;
    username: string;
    avatarUrl?: string;
    sockets: Set<string>;   //for multi-tab support
  }> 
>();

/** AI GENERATION LOCKS
 * resourceId -> State object
 * Prevents multiple users from calling the GEMINI API for the same file at the same time
 */
const activeGenerationLocks = new Map();

/** *Helper: 
 * Broadcasts all current locks of a workspace to keep progress bars in sync for everyone
 */
const broadcastWorkspaceLocks = (workspaceId: string) => {
  const locks = Array.from(activeGenerationLocks.values())
  .filter((lock: any) => String(lock.workspaceId) === String(workspaceId));

  io.to(`workspace:${workspaceId}`).emit("workspace_locks_update", locks);
}

/** SOCKET AUTHENTICATION MIDDLEWARE 
 * Decodes the NextAuth JWT to verify identify before allowing a connection
 */
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;  //token sent from client
   
    // No token -> allows connection, but mark as authenticated
    if(!token){
      socket.data.user = null;
      return next();
    }

    try {
      // Decode NextAuth JWT (JWE)
        const decoded = await decode({
          token,
          secret: config.NEXTAUTH_SECRET!,
        })
        
        if(!decoded) return next(new Error("unauthenticated"));

        // Attach user to socket for later use
        socket.data.user = decoded;
        return next();
    } catch (error) {
      // On decode failure, allow connection but unauthenticated
      console.error("[socket auth] decode failed:", error);
      socket.data.user = null;
      return  next();
    }
})

/**
 * Socket Connection Handler (Events)
 */
io.on("connection", (socket) => {

    // Join personal room for direct user notifications
    if(socket.data.user?._id){
      socket.join(`user:${socket.data.user?._id}`);
    }

    /** *EVENT: Workspace Join
     * Subscribe a user to a specific workspace "room" for presence updates
     */
    socket.on("workspace:join", ({ workspaceId }, ack) => {
      // ensure auth at event level
      if (!socket.data.user) {
        socket.emit("workspace:denied", { reason: "unauthenticated" });
        if(typeof ack === "function"){
          ack({
            ok: false,
            reason: "unauthenticated"
          });
        }
        return;
      }

      const userId = socket.data.user._id;
      socket.data.currentWorkspaceId = workspaceId;

      // Initialize workspace map
      if(!workspacePresence.has(workspaceId)){
        workspacePresence.set(workspaceId, new Map());
      }

      const usersMap = workspacePresence.get(workspaceId)!;
      const sockets = usersMap.get(userId);

      //Already joined on this socket - idempotent 
      if(sockets && sockets.has(socket.id)){
        if(typeof ack === "function") ack({ ok: true });
        return;
      }

      // Initialize user socket set
      if(!usersMap.has(userId)){
        usersMap.set(userId, new Set());
      }

      usersMap.get(userId)!.add(socket.id);
      // Join workspace-specific room
      socket.join(`workspace:${workspaceId}`);

      io.to(`workspace:${workspaceId}`).emit("presence:update",{
        workspaceId,
        users: Array.from(usersMap.keys()),
      });

      if(typeof ack === "function"){
        ack({ ok: true });
      }
    });
    
    socket.on("workspace:leave", ({ workspaceId }) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    /** *EVENT: AI Generation Request
     * Handles hierarchical locking logic (preventing conflicts between parent folders and child files)
     */
    socket.on("request_gen_start", ({
      resourceId,
      parentId,
      workspaceId,
      username
    }) => {
      const rId = String(resourceId);
      const pId = String(parentId);
      const wId = String(workspaceId);
      const name = String(username);
      // 1. Direct Lock Check
      if(activeGenerationLocks.has(rId)){
        socket.emit("lock_denied", {
           resourceId :rId,
           reason: "already_locked", 
          });
        return;
      }

      //2. Upward Hierarchy Check (Is parent being processed?)
      if(pId && activeGenerationLocks.has(pId)){
        return socket.emit("lock_denied", {
          resourceId: rId,
          reason: "parent_locked",
        });
      }

      //3. Downward Hierarchy Check (Are children being processed?)
      for(const [id, state] of activeGenerationLocks.entries()){
        if(state.pId === rId){
          return socket.emit("lock_denied", {
            resourceId: rId,
            reason: "child_locked",
          });
        }
      }

      // Grant lock if all checks pass
      const genState = {
        ownerId: socket.id,
        workspaceId: wId,
        username: name || "Anonymous",
        progress: 0,
        resourceId: rId,
        parentId: pId,
        currentCount: 0,
        totalCards: 0,
      };

      activeGenerationLocks.set(rId, genState);

      socket.emit("lock_granted", { rId });

      io.to(`workspace:${wId}`).emit("gen_status_update", {
          resourceId: genState.resourceId,
          workspaceId: genState.workspaceId,
          progress: genState.progress,
          currentCount: genState.currentCount,
          totalCards: genState.totalCards,
      });
      // Notify everyone in the workspace about the new process
      // io.to(`workspace:${wId}`).emit("gen_status_update", genState);
      broadcastWorkspaceLocks(wId);

      // GHOST LOCK PROTECTION: Auto-release after 5 mins if client crashes
      setTimeout(() => {
        if(activeGenerationLocks.has(rId)){
          const currentLock = activeGenerationLocks.get(rId);
          if(currentLock.ownerId === socket.id){
            activeGenerationLocks.delete(rId);
            broadcastWorkspaceLocks(workspaceId);
          }
        }
      }, 5*60*1000);
    });

    /** EVENT: Progress Reporting - Updating all clients on AI generation status */
    socket.on("report_progress", ({
      resourceId,
      workspaceId,
      progress,
      currentCount,
      totalCards,
    }) => {
      const state = activeGenerationLocks.get(resourceId);
      if(state){
        state.progress = progress;
        state.currentCount = currentCount;
        state.totalCards = totalCards;

        io.to(`workspace:${workspaceId}`).emit("gen_status_update", {
          resourceId,
          workspaceId,
          progress,
          currentCount,
          totalCards,
        });
        
        broadcastWorkspaceLocks(workspaceId);
      }
    });

    /**EVENT: Generation End - Releases the lock so others can use the resouce */
    socket.on("request_gen_end", ({
      resourceId,
      workspaceId
    }) => {
      activeGenerationLocks.delete(resourceId);
      broadcastWorkspaceLocks(workspaceId);
      // Tell everyone to hide the progress bar
      io.to(`workspace:${workspaceId}`).emit("gen_completed", { resourceId });

      // Tell everyone to refresh their flashcard sheet list
      io.to(`workspace:${workspaceId}`).emit("flashcard_set_completed", { resourceId });
    });


    socket.on("get_workspace_locks", ({ workspaceId }) => {
      const activeLocks = Array.from(activeGenerationLocks.values())
      .filter((lock: any) => String(lock.workspaceId) === String(workspaceId));
      socket.emit("workspace_locks_update", activeLocks);
    });

  // --- TITLE EDITING EVENTS ---

  // 1. User starts editing (double clicking the title)
    socket.on("presence:remote-editing-start", ({
      workspaceId,
      itemId,
      username,
      userId
    }) => {
      // Broadcast to others in the workspace room
      socket.to(`workspace:${workspaceId}`).emit("presence:remote-editing-start", {
        itemId,
        userId,
        username
      });

      // Store when item this specific socket is editing for disconnect cleanup
      socket.data.editing = { workspaceId, itemId };
    });


    // 2. User is typing (High frequency)
    socket.on("presence:remote-editing-typing", ({
      workspaceId,
      itemId,
      tempTitle
    }) => {
      socket.to(`workspace:${workspaceId}`).emit("presence:remote-editing-typing", {
        itemId,
        tempTitle
      });
    });

    // 3. User stops editing (Blur, Escape or Save)
    socket.on("presence:remote-editing-stop", ({ 
      workspaceId,
      itemId
    }) => {
      socket.to(`workspace:${workspaceId}`).emit("presence:remote-editing-stop", {
        itemId
      });

      socket.data.editing = null;
    });

    /** *EVENT: File Join
     * Subscribe a user to a specific file "room" for presence updates
     */
    socket.on("file:join", async ({ fileId }) => {
      // 1. Validation
      if(!socket.data.user || !fileId) return;

      const { _id:userId , username, avatarUrl } = socket.data.user;

      socket.data.currentFileId = fileId;
     
      //2. Join the Socket.io Room
      const roomName = `file:${fileId}`;
      socket.join(roomName);

      //3. Ensure the file room exists
      if(!activeFileUsers.has(fileId)){
        activeFileUsers.set(fileId, new Map());
      }

      const usersInFile = activeFileUsers.get(fileId);

      if(!usersInFile) return;

      // 4.Add or update user entry
      if(!usersInFile.has(userId)){
        usersInFile.set(userId, {
          userId,
          username,
          avatarUrl,
          sockets: new Set([socket.id]),
        });
      }else{
        // User is already here in another tab, just add this socket
        usersInFile.get(userId)!.sockets.add(socket.id);
      }

      // 5. Broadcast the current list 
      const presenceList = Array.from(usersInFile?.values()).map(user => ({
        userId: user.userId,
        username: user.username,
        avatarUrl: user.avatarUrl
      }));

      // Broadcast the array of user objects to everyone in the file
      io.to(`file:${fileId}`).emit("file:presence",
        presenceList
      );

      // --- Hydration, now DB-backed instead of blank---
      if(!docs.has(fileId)){
        const newDoc = new Y.Doc();
        newDoc.getXmlFragment("document-content");

        try {
            const res = await fetch(`${process.env.MAIN_API_URL}/api/file/${fileId}`);
            const json = await res.json();
            const contentBinary = json?.data?.contentBinary;
            if(contentBinary?.data?.length){
              const bytes = new Uint8Array(contentBinary.data);
              Y.applyUpdate(newDoc, bytes);
            }
        } catch (error) {
          console.error(`[file:join] Failed to hydrate ${fileId} from DB: `,error);
        }
        docs.set(fileId, newDoc);
      }
      const doc = docs.get(fileId)!;
      const state = Y.encodeStateAsUpdate(doc);
      socket.emit("file:update-raw", state);
    });

    
  /** *YJS LIVE EDITING HANDLES
   * Relay updates between users for shared document editing
   */
  socket.on("file:update-raw", ({ fileId, update }: {
    fileId: string,
    update: Uint8Array
  }) => {
    // 1. Live Relay 
    socket.to(`file:${fileId}`).emit("file:update-raw", update);

    // 2. Update the Server's "Mirror" Doc
    // Sync server-side mirror and debounce database save
    if(!docs.has(fileId)){
      const newDoc = new Y.Doc();
      newDoc.getXmlFragment("document-content");
      docs.set(fileId, newDoc);
    }
    const doc = docs.get(fileId);
    if(!doc) return;
      try {
        Y.applyUpdate(doc, new Uint8Array(update));
        // 3. Debounce the Save job
    // Wait for 2 sec of silence before asking the Worker to save to DB
    clearTimeout(saveTimers.get(fileId));

    const timer = setTimeout(async() => {
      const state = Y.encodeStateAsUpdate(doc);
        await fileSyncQueue.add(
          "persist-file",
          {
            fileId,
            contentBinary: Buffer.from(state).toString("base64"),
            userId: socket.data.user?._id,
          },
          { 
            jobId: fileId,
            removeOnComplete: true
          }
        );
      saveTimers.delete(fileId);
      // CLEANUP AFTER SAVE: Check if room is empty now that save completed
      const activeUsers = activeFileUsers.get(fileId);
      if (!activeUsers || activeUsers.size === 0) {
        if (docs.has(fileId)) {
          const docToDestroy = docs.get(fileId);
          docToDestroy?.destroy();
          docs.delete(fileId);
        }
      }
    }, 2000);

    saveTimers.set(fileId, timer);
      } catch (error) {
        console.error("[File Update Raw] Update Error: ",error);
      }
  
  })

  socket.on("file:awareness-update", ({ fileId, update }: {
    fileId: string,
    update: Uint8Array,
  }) => {
    // 1. Live Relay
    socket.volatile.to(`file:${fileId}`).emit("file:awareness-update", update);

  })

  socket.on("file:leave", ({ fileId }) => {

    if(!socket.data.user) return;
    const userId = socket.data.user._id;

    const usersInFile = activeFileUsers.get(fileId);
    if(usersInFile && usersInFile.has(userId)){
      const userSession = usersInFile.get(userId)!;

      // Remove this specific socket
      userSession.sockets.delete(socket.id);

      // If no socket left for this user, remove user from presence
      if(userSession.sockets.size === 0){
        usersInFile.delete(userId);
      }

      // Cleanup empty file rooms
      if(usersInFile.size === 0){
        activeFileUsers.delete(fileId);

        // --- SAFE MEMORY CLEANUP ---
        // Check if there is a pending save timer for this file
        const pendingTimer = saveTimers.get(fileId);

        if (pendingTimer) {
          // A save is scheduled! Let the timer finish, then destroy doc from RAM
          // We leave the doc in RAM for now; the setTimeout callback inside file:update-raw
          // will finish the persistence job.
        } else {
          // No save pending! Safe to immediately release from memory
          if (docs.has(fileId)) {
            const doc = docs.get(fileId);
            doc?.destroy(); // Free Yjs internal memory allocations
            docs.delete(fileId);
          }
        }
      }else{
        // Broadcast updated list
        const presenceList = Array.from(usersInFile.values()).map(user => ({
          userId: user.userId,
          username: user.username,
          avatarUrl: user.avatarUrl,
        }));

        io.to(`file:${fileId}`).emit("file:presence", presenceList);
      }
    }
    socket.leave(`file:${fileId}`);
   
  });

  /** Misc */
  socket.on("user:rejoin", () => {
    if(socket.data.user?._id) {
      socket.join(`user:${socket.data.user?._id}`);
    }
  });

   /** *CLEANUP: Handles disconnections
    *   Removes user from presence maps and releases any active AI locks held by this socket
    */
  socket.on("disconnect", reason => {
    logMemoryUsage(`Disconnect (${socket.id})`);
    const user = socket.data.user;
    if(!user) return;
    const userId = user._id;

    //1. Presence Cleanup
    if(socket.data.currentWorkspaceId){
      const workspaceId = socket.data.currentWorkspaceId;
      const usersMap = workspacePresence.get(workspaceId);

      if(usersMap?.has(userId)){
        const sockets = usersMap.get(userId);
        sockets?.delete(socket.id);

        if(sockets?.size === 0){
          usersMap.delete(userId);

          io.to(`workspace:${workspaceId}`).emit("presence:update", {
            workspaceId,
            users: Array.from(usersMap.keys()),
          });
        }
        if(usersMap.size === 0){
          workspacePresence.delete(workspaceId);
        }
      }
    }

    // 2. Optimized File Presence Cleanup
    if(socket.data.currentFileId){
        const fileId = socket.data.currentFileId;
        const usersInFile = activeFileUsers.get(fileId);

        if(usersInFile?.has(userId)){
          const session = usersInFile.get(userId);
          session?.sockets.delete(socket.id);

          if(session?.sockets.size === 0){
            usersInFile.delete(userId);
          }
          if(usersInFile.size === 0){
            activeFileUsers.delete(fileId);

            // Trigger RAM cleanup check for docs here if needed
            const pendingTimer = saveTimers.get(fileId);
            if (!pendingTimer && docs.has(fileId)) {
              const doc = docs.get(fileId);
              doc?.destroy();
              docs.delete(fileId);
            }
          }else{
            io.to(`file:${fileId}`).emit("file:presence", 
              Array.from(usersInFile.values()).map(u => ({
                userId: u.userId,
                username: u.username,
                avatarUrl: u.avatarUrl,
              }))
            );
          }
        }
    }

    // 3. AI Generation lock cleanup
    for(const [resId, state ] of activeGenerationLocks.entries()){
      if(state.ownerId === socket.id){
        activeGenerationLocks.delete(resId);
        broadcastWorkspaceLocks(state.workspaceId);
      }
    }

    // 4. Title Editing cleanup
    if(socket.data.editing){
      const {workspaceId, itemId } = socket.data.editing;
      socket.to(`workspace:${workspaceId}`).emit("presence:remote-editing-stop", { itemId });
    }

  });
});


/** Workspace tree change (folder/file CRUD) */
app.post("/emit/workspace-tree-update", (req,res) => {

  const { workspaceId, type, payload, senderSocketId } = req.body;
  const room = `workspace:${workspaceId}`;
  const clients = io.sockets.adapter.rooms.get(room);
  const clientCount = clients ? clients.size : 0 ;

  io.to(`workspace:${workspaceId}`).except(senderSocketId).emit("workspace:tree:update", {
    type,
    payload,
  });

  return res.json({ ok: true })
});

/** Workspace member added/removed */
app.post("/emit/workspace-members-update",(req,res) => {
  const { workspaceId, userId, username, action, member } = req.body;

  if(!workspaceId || !userId || !username){  
    return res.status(400).json({
        error: "WorkspaceId and userId are required",
    });
  }

  if(!username){
    return res.status(400).json({
        error: "Username is required",
    });
  }

  const room = `workspace:${workspaceId}`;
  const clients = io.sockets.adapter.rooms.get(room);

  io.to(`workspace:${workspaceId}`).emit("members:update", {
    workspaceId,
    userId,
    username,
    action,
    member,
  });

  return res.json({ ok: true })
})


/** Yjs binary update from a worker (PDF import, etc.) */
app.post("/emit/file-update", (req,res) => {

  const { workspaceId, fileId, update, userId } = req.body;

  if(!fileId || !userId){
    return res.status(400).json({
        error: "FileId and userId is required",
    });
  }

  if(!update){
    return res.status(400).json({
        error: "Update is required",
    });
  }

  const room = `workspace:${workspaceId}`;
  const clients = io.sockets.adapter.rooms.get(room);
  io.to(`file:${fileId}`).emit("file:update", {
    fileId,
    update,
    userId,
  });

  return res.json({ ok: true })
})

/** AI generation progress  */
app.post("/emit/progress-update", (req, res) => {
  const {
    resourceId,
    workspaceId,
    progress,
    currentCount,
    totalCards,
  } = req.body;

  // 1. Find the lock in map
  const state = activeGenerationLocks.get(String(resourceId));

  if(state){
    // 2. Update the state
    state.progress = progress;
    state.currentCount = currentCount;
    state.totalCards = totalCards;
    
    // 3. Broadcast to the workspace room
    io.to(`workspace:${state.workspaceId}`).emit("gen_status_update", state);
    return res.json({ ok: true });
  }

  console.warn(`[Server] Progress Update Error, FAILED: No lock found for ${resourceId}`);
  res.status(404).json({
    error: "No active lock found for this resouce."
  });
});

/** Flashcard set created (new set, new cards) */
app.post("/emit/set-created", (req, res) => {
  const { workspaceId, resourceId } = req.body;

  io.to(`workspace:${workspaceId}`).emit("flashcard_set_created", { resourceId });
  res.json({ ok: true });
});

/** Flashcard set deleted */
app.post("/emit/set-deleted", (req, res) => {
  const { workspaceId, setId } = req.body;

  io.to(`workspace:${workspaceId}`).emit("flashcard_set_deleted", { setId });
  res.json({ ok: true });
});

/** Flashcard set title updated */
app.post("/emit/set-updated", (req, res) => {
  const { workspaceId, setId, updates } = req.body;
  if(!workspaceId || !setId){
    return res.status(400).json({
      error: "workspaceId and setId is required",
    });
  }

  io.to(`workspace:${workspaceId}`).emit("workspace:tree:update", {
    type: "flashcard_set_updated",
    payload: { setId, updates },
  });

  return res.json({ ok: true });
});

/** Full flashcard set regenerated (same set, cards replaced) */
app.post("/emit/set-regenerated", (req, res) => {
  const { workspaceId, setId, resourceId } = req.body;

  if(!workspaceId || !setId){
    return res.status(400).json({
      error: "workspaceId and setId is required",
    });
  }

  io.to(`workspace:${workspaceId}`).emit("workspace:tree:update", {
    type: "flashcard_set_regenerated",
    payload: { setId, resourceId },
  });

  return res.json({ ok: true });
});

/** Single card within a set regenerated */
app.post("/emit/card-regenerated", (req, res) => {
  const { workspaceId, setId, cardId } = req.body;

  if(!workspaceId || !setId || !cardId){
    return res.status(400).json({
      error: "workspaceId, setId and cardId is required",
    });
  }

  io.to(`workspace:${workspaceId}`).emit("workspace:tree:update", {
    type: "flashcard_card_regenerated",
    payload: { setId, cardId },
  });

  return res.json({ ok: true });
});

/**  Flashcard set marked outdated (file content changed)*/
app.post("/emit/set-outdated", (req, res) => {
  const { workspaceId, resourceId } = req.body;
  if(!workspaceId || !resourceId) {
    return res.status(400).json({
      error: "workspaceId and resourceId required",
    });
  }

  io.to(`workspace:${workspaceId}`).emit("workspace:tree:update", {
    type: "flashcard_set_outdated",
    payload: { resourceId },
  });
  return res.json({ ok: true });
});

/** Reading time updated after file sync */
app.post("/emit/file-stats-updated", (req, res) => {
  const { workspaceId, folderId, fileId, readingTimeMinutes } = req.body;
  if(!workspaceId || !fileId){
    return res.status(400).json({
      error: "workspaceId and fileId required",
    });
  }

  io.to(`workspace:${workspaceId}`).emit("workspace:tree:update", {
    type: "file_stats_updated",
    payload: {
      folderId,
      fileId,
      readingTimeMinutes,
    }
  });
  return res.json({ ok: true });
});

/** Activity created (new Recent Activity card) */
app.post("/emit/activity-created", (req, res) => {
  const { workspaceId, events } = req.body;
  if(!workspaceId) {
    return res.status(400).json({
      error: "workspaceId required",
    });
  }

  if(!events){
    return res.status(400).json({
      error: "events required",
    });
  }

  io.to(`workspace:${workspaceId}`).emit("workspace:tree:update", {
    type: "activity_created",
    payload: { events },
  });
  return res.json({ ok: true });
});

/** Workspace-Invitation */
app.post("/emit/workspace-invitation", (req, res) => {
  const {
    recipientId,
    invitationId,
    workspaceId,
    workspaceTitle,
    invitedByUsername,
    role,
    action,
  } = req.body;

  if(!recipientId || !invitationId || !workspaceId){
    return res.status(400).json({
      error: "recipientId, invitationId and workspaceId are required",
    });
  }

  // Emit to the invited user's personal room
  io.to(`user:${recipientId}`).emit("workspace-invitation", {
    invitationId,
    workspaceId,
    workspaceTitle,
    invitedByUsername,
    role,
    action: action ?? "received",
  });

  return res.json({ ok: true });
});

/** Invitation response (accepted/rejected) sent back to inviter */
app.post("/emit/workspace-invitation-response", (req, res) => {
  const {
    recipientId,
    workspaceId,
    invitationId,
    invitedUserId,
    action,
  } = req.body;

  if(!recipientId || !workspaceId || !invitationId){
    return res.status(400).json({
      error: "recipientId, workspaceId and invitationId is required",
    });
  }

  if(action !== "accepted" && action !== "rejected"){
    return res.status(400).json({
      error: "action must be accepted or rejected",
    });
  }

  io.to(`user:${recipientId}`).emit("workspace-invitation-response", {
    workspaceId,
    invitationId,
    invitedUserId,
    action,
  });

  return res.json({ ok: true });
});

/** General notification to a specific user */
app.post("/emit/notification", (req, res) => {
  const { recipientId, notification } = req.body;

  if(!recipientId || !notification){
    return res.status(400).json({
      error: "recipientId and notification are required",
    });
  }

  io.to(`user:${recipientId}`).emit("notification:new", notification);
  return res.json({ ok: true });
});

/** User joined a workspace (after accepting invitation) */
app.post("/emit/workspace-joined", (req, res) => {
  const { recipientId, workspace } = req.body;

  if(!recipientId || !workspace){
    return res.status(400).json({
      error: "recipientId and workspace are required",
    });
  }

  // Emit to the accepted user's personal room
  io.to(`user:${recipientId}`).emit("workspace:joined", { workspace });

  return res.json({ ok: true });
});

/** User left a workspace */
app.post("/emit/workspace-left", (req, res) => {
  const { recipientId, workspaceId } = req.body;

  if(!recipientId || !workspaceId){
    return res.status(400).json({
      error: "recipientId and workspaceId are required",
    });
  }

  io.to(`user:${recipientId}`).emit("workspace:left", { workspaceId });
  return res.json({ ok: true });
});

app.post("/emit/usage-updated", (req, res) => {
  const { workspaceId } = req.body;
  io.to(`workspace:${workspaceId}`).emit("workspace:tree:update", {
    type: "usage_updated",
    payload: { workspaceId },
  });

  return res.json({ ok: true });
});

/**Generic emit fallback (legacy - prefer specific endpoints above) */
app.post("/api/socket/emit", (req, res) => {
  const { workspaceId, type, payload } = req.body;

  if(!workspaceId || !type){
    return res.status(400).json({
      error: "workspaceId and type is required",
    });
  }

  // Target the specific workspace room
  const room = `workspace:${workspaceId}`;

  io.to(room).emit("workspace:tree:update", {
    type,
    payload,
  });

  return res.json({ ok: true });
});

app.post("/emit/apply-inbox-block", async (req, res) => {
  const { fileId,block, blocks, userId, workspaceId } = req.body;

  // Accept either a single block object or an array of blocks
  const blockstoApply = Array.isArray(blocks) && blocks.length > 0
    ? blocks : (block ? [block] : []);

  if(!fileId || blockstoApply.length === 0){
    return res.status(400).json({
      error: "FileId and atleast one valid block are required",
    });
  }

  // Basic validation check for block structure
  for(const b of blockstoApply){
    if(!b?.id || !b?.type){
      return res.status(400).json({
        error: "Each block must contain an id and a type property",
      });
    }
  }
  try {
    let doc = docs.get(fileId);
    if(!doc){
      const appUrl = process.env.MAIN_API_URL;
      if(!appUrl){
        console.error("[apply-inbox-block] MAIN_APP_URL not set - refusing to merge to avoid data loss");
        return res.status(500).json({ error: "Server misconfigured: APP_URL not set"});
      }
      const newDoc = new Y.Doc();
      // newDoc.getXmlFragment("document-content");
      try {
        const fetchRes = await fetch(`${appUrl}/api/file/${fileId}`);
        const json = await fetchRes.json();
        const contentBinary = json?.data?.contentBinary;
        if(contentBinary?.data?.length){
          Y.applyUpdate(newDoc, new Uint8Array(contentBinary.data));
        }
      } catch (err) {
        console.error(`[apply-inbox-block] Failed to hydrate ${fileId}: `,err);
        return res.status(502).json({ error: "Failed to hydrate file content before merge"});
      }
      docs.set(fileId, newDoc);
      doc = newDoc;
    }
    
    doc.transact(() => {
      const fragment = doc.getXmlFragment("document-content");

      let blockGroup = fragment.toArray().find(
        (node): node is Y.XmlElement =>
          node instanceof Y.XmlElement && node.nodeName === "blockGroup"
      );
      if (!blockGroup) {
        blockGroup = new Y.XmlElement("blockGroup");
        fragment.push([blockGroup]);
      }

      for (const item of blockstoApply) {
        // 1. Create and push blockContainer to doc FIRST
        const container = new Y.XmlElement("blockContainer");
        container.setAttribute("id", item.id);
        blockGroup.push([container]);

        // 2. Create inner element and push to container
        const inner = new Y.XmlElement(item.type);
        for (const [key, value] of Object.entries(item.props ?? {})) {
          if (value !== undefined && value !== null) {
            inner.setAttribute(key, String(value));
          }
        }
        container.push([inner]);

        // 3. Add text/styles now that inner is attached to doc
        if (Array.isArray(item.content) && item.content.length > 0) {
          item.content.forEach((c: any) => {
            if (c.text) {
              const xmlText = new Y.XmlText(c.text);
              inner.push([xmlText]);

              if (c.styles && typeof c.styles === "object") {
                for (const [styleKey, styleValue] of Object.entries(c.styles)) {
                  if (styleValue) {
                    xmlText.format(0, c.text.length, { [styleKey]: styleValue });
                  }
                }
              }
            }
          });
        } else if (item.plainText && item.plainText.length > 0) {
          const xmlText = new Y.XmlText(item.plainText);
          inner.push([xmlText]);
        }
      }
    });
   
    const update = Y.encodeStateAsUpdate(doc);
    io.to(`file:${fileId}`).emit("file:update-raw", update);

    if(workspaceId){
      io.to(`workspace:${workspaceId}`).emit("workspace:tree:update", {
        type: "file_content_updated",
        payload: { fileId },
      });
    }

    clearTimeout(saveTimers.get(fileId));
    saveTimers.delete(fileId);

    // Queue persistence job for BullMQ background worker
    const firstBlockId = blockstoApply[0].id;
    const jobId = `inbox-merge-${fileId}-${firstBlockId}-${Date.now()}`;

    const state = Y.encodeStateAsUpdate(doc);
    const job = await fileSyncQueue.add(
      "persist-file",
      {
        fileId,
        contentBinary: Buffer.from(state).toString("base64"),
        userId,
      },
      {
        jobId,
        removeOnComplete: true 
      }
    );

    try {
      await job.waitUntilFinished(fileSyncQueueEvents, 15000);
    } catch (waitError) {
      console.error(`[apply-inbox-block] Worker did not confirm persistence for ${fileId}: `,waitError);
      return res.status(504).json({
        error: "Timed out waiting for file to be saved"
      });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("[apply-inbox-block] error: ",error);
    return res.status(500).json({ error: "Failed to apply block" });
  }
});

/** Start the realtime server */
const PORT = 4000;
// --- Add Memory Monitoring Here ---
function logMemoryUsage(label: string = "") {
  const mem = process.memoryUsage();
  const rssMB = (mem.rss / 1024 / 1024).toFixed(2);
  const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
}

// Log initial footprint on server startup
logMemoryUsage("Server Startup");

// Log automatically every 15 seconds
setInterval(() => {
  logMemoryUsage("Periodic");
}, 15000);
// ----------------------------------
server.listen(PORT, () => {
  console.log("Realtime server running on port", PORT);
});