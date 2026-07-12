import { initPDFWorker } from "./pdfWorker";
import { initFileSyncWorker } from "./syncWorker";
import { initTermIndexWorker } from "./workspace-term-index";

console.log("[Workers] Boosting all background workers....");

initFileSyncWorker();
initPDFWorker();
initTermIndexWorker();

console.log("[Workers] All workers running");

process.on("SIGTERM",() => {
    console.log("[Workers] SIGTERM received, shutting down.");
    process.exit(0);
});