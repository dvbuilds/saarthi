import { Queue } from "bullmq";
import { redisConnection } from "../config/redisConnection.js";

export const documentQueue = new Queue("document-processing", {
    connection: redisConnection,
})