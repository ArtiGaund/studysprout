/**
 * SHARED REDIS CONFIG
 * -------------------
 * Using a single config object ensures all queues and workers 
 * point to the same Ubuntu Redis instance.
 */

import { ConnectionOptions } from "bullmq";

export const redisConnection: ConnectionOptions = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    maxRetriesPerRequest: null,
};