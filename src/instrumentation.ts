/**
 * NEXT.JS INSTRUCTION
 * -------------------
 * This file is used to run code at the very start of the server lifecycle.
 * In Studysprout, we use it to boot up our background processing workers.
 */

export async function register(){
    /** *ENVIRONMENT CHECK:
     * We only initialize the worker if the current runtime is 'nodejs'.
     * This prevents the worker from trying to run in Edge functions or client side environments
     * where BULLMQ/Redis cannot operate.
     */
    if(process.env.NEXT_RUNTIME === 'nodejs'){

        // DYNAMIC IMPORT: Ensures the worker code is only loaded on the server
        const { initFileSyncWorker } = await import(`@/lib/workers/syncWorker`);
        const { initPDFWorker } = await import(`@/lib/workers/pdfWorker`);
        const { initTermIndexWorker } = await import(`@/lib/workers/workspace-term-index`);

        /** *INITIALIZE BULLMQ SYNC WORKER:
         * This worker listens for "persist-file" jobs from the Realtime Server.
         * It is responsible for taking Yjs binary updates and saving them back into the MongoDB
         * document content.
         */
        initFileSyncWorker();
        initPDFWorker();
        initTermIndexWorker();

        console.log("Background Workers (Sync & PDF) Initialized");
    }
}