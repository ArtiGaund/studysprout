/**
 * SHARED REDIS CONFIG
 * -------------------
 * Using a single config object ensures all queues and workers 
 * point to the same Ubuntu Redis instance.
 */

import { ConnectionOptions } from "bullmq";

const redisUrl = new URL(process.env.REDIS_URL || "redis://localhost:6379");

export const redisConnection: ConnectionOptions = {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port || "6379"),
    password: redisUrl.password || undefined,
    tls: redisUrl.protocol === "rediss:" ? {} : undefined, // Upstash needs this
    maxRetriesPerRequest: null,
};