import "dotenv/config";
import connectDB from "./connect/db.js";
import { startWorkers } from "./workers/startWorkers.js";

// Deliberately no Express app here — this process only pulls jobs off
// BullMQ and processes them. Run as many replicas of this as your Groq
// rate limits and load actually need, independently of how many API
// replicas you're running (see docker-compose.yml: `--scale worker=N`).
const start = async () => {
    await connectDB();
    startWorkers();
    console.log("[worker] Worker process started (no HTTP server in this process)");
};

start();
