import { Emitter } from "@socket.io/redis-emitter";
import redisClient, { isRedisAvailable } from "../config/redis.js";

let ioEmitter = null;

export const initSocketEmitter = () => {
    if (isRedisAvailable && redisClient.status !== 'mock') {
        ioEmitter = new Emitter(redisClient);
        console.log("✅ [SocketEmitter] Connected to Redis");
    } else {
        console.warn("ℹ️ [SocketEmitter] Running in mock mode (no Redis)");
    }
};

const mockIo = {
    to: () => mockIo,
    in: () => mockIo,
    emit: () => { }
};

export const getIo = () => {
    return ioEmitter || mockIo;
};
