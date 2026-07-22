import { Queue } from 'bullmq';
import { redisConnection } from '../config/redisConnection.js';

export const generationQueue = new Queue("ai-generation", {
    connection: redisConnection,
})
