import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import redisClient, { isRedisAvailable } from "./config/redis.js";
import connectdb from "./config/db.js";
import initSocket from "./config/socket.js";
import "./config/firebaseAdmin.js"; // In case sockets verify firebase tokens etc

const Port = process.env.SOCKET_PORT || 8081;
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Socket server is running.\n");
});

const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            process.env.FRONTEND_URL,
            "https://frameverse-zeta.vercel.app",
            "https://frameverse.onrender.com",
            "https://frameverse.online",
            "https://www.frameverse.online"
        ].filter(Boolean),
        methods: ["GET", "POST"],
        credentials: true
    },
});

// Setup Redis Adapter for multi-server scalability
if (isRedisAvailable && redisClient.status !== 'mock') {
    const pubClient = redisClient;
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    console.log("✅ [SocketServer] Redis adapter successfully configured");
} else {
    console.warn("ℹ️ [SocketServer] Running without Redis adapter (local only)");
}

connectdb();
initSocket(io);

server.listen(Port, () => {
    console.log(`[Socket Server] listening on port ${Port}`);
});
