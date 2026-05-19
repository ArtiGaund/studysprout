import { Queue } from "bullmq";
import { redisConnection } from "./redis-connection";


export const pdfQueue = new Queue('pdf-processing', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 10000,                   //wait 10s before retry
        },
        removeOnComplete: { count: 100 }, //keep the last 100 successful jobs for debugging
        removeOnFail: { count: 100 }, //keep failed jobs longer to see what went wrong
    }
});