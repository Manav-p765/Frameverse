import { Emitter } from "@socket.io/redis-emitter";
import redisClient, { isRedisAvailable } from "../config/redis.js";

let ioEmitter = null;
let localIo = null;

export const setIo = (io) => {
    localIo = io;
};

export const initSocketEmitter = () => {
    if (isRedisAvailable && redisClient.status !== 'mock') {
        ioEmitter = new Emitter(redisClient);
        console.log("✅ [SocketEmitter] Connected to Redis");
    } else {
        console.warn("ℹ️ [SocketEmitter] Using local Socket.IO instance");
    }
};

export const getIo = () => {
    if (ioEmitter) return ioEmitter;
    if (localIo) return localIo;
    return null;
};
