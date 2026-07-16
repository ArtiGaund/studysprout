import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Dynamic import defers loading until AFTER dotenv.config() has run
async function main() {
  const { initPDFWorker } = await import("./pdfWorker");
  const { initFileSyncWorker } = await import("./syncWorker");
  const { initTermIndexWorker } = await import("./workspace-term-index");

  initFileSyncWorker();
  initPDFWorker();
  initTermIndexWorker();
}

main().catch((err) => {
  console.error("[Workers] Failed to start:", err);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("[Workers] SIGTERM received, shutting down.");
  process.exit(0);
});