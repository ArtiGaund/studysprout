import { initPDFWorker } from "./pdfWorker";
import { initFileSyncWorker } from "./syncWorker";
import { initTermIndexWorker } from "./workspace-term-index";

initFileSyncWorker();
initPDFWorker();
initTermIndexWorker();

process.on("SIGTERM",() => {
    console.log("[Workers] SIGTERM received, shutting down.");
    process.exit(0);
});