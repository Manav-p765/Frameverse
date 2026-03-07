import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient;
let isRedisAvailable = false;

// Only attempt to connect if REDIS_URL exists or if we're not in a strict environment
// For local dev, we will provide an in-memory fallback to prevent crashes if Redis isn't installed.
try {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

    redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1, // Only try once on start to detect availability
        connectTimeout: 2000,
        enableReadyCheck: true,
        retryStrategy: (times) => {
            if (times > 3) {
                // If we've failed 3 times, we probably don't have Redis locally
                console.warn('--- REDIS NOT FOUND: FALLING BACK TO IN-MEMORY MODE ---');
                return null; // Stop retrying
            }
            return Math.min(times * 100, 2000);
        }
    });

    redisClient.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
            isRedisAvailable = false;
        } else {
            console.error('Redis Client Error', err);
        }
    });

    redisClient.on('ready', () => {
        isRedisAvailable = true;
        console.log('✅ [Redis] Connected and ready');
    });

} catch (e) {
    console.warn('❌ [Redis] Initialization failed, falling back to memory');
}

// Simple in-memory fallback for basic get/set
const memoryStore = new Map();
const mockRedis = {
    get: async (key) => memoryStore.get(key) || null,
    set: async (key, val) => memoryStore.set(key, val),
    setex: async (key, ttl, val) => {
        memoryStore.set(key, val);
        setTimeout(() => memoryStore.delete(key), ttl * 1000);
    },
    del: async (key) => memoryStore.delete(key),
    call: async () => null, // Placeholder for rate-limiter calls
    on: () => { },
    status: 'mock'
};

// Log initial status if not connected after some time
setTimeout(() => {
    if (!isRedisAvailable && redisClient.status !== 'ready') {
        console.log('ℹ️ [Redis] Running in fallback MEMORY mode');
    }
}, 5000);

export { isRedisAvailable };
export default redisClient || mockRedis;
