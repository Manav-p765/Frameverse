import redisClient, { isRedisAvailable } from "../config/redis.js";

/**
 * Get data from Redis cache. Returns null gracefully if Redis fails.
 * @param {string} key 
 * @returns {Promise<any>}
 */
export const getCache = async (key) => {
    if (!isRedisAvailable || !redisClient) return null;
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error(`[Cache] Get Error for ${key}:`, err);
        return null;
    }
};

/**
 * Set data in Redis cache. Fails gracefully.
 * @param {string} key 
 * @param {any} data 
 * @param {number} ttl TTL in seconds
 */
export const setCache = async (key, data, ttl) => {
    if (!isRedisAvailable || !redisClient) return;
    try {
        await redisClient.setex(key, ttl, JSON.stringify(data));
    } catch (err) {
        console.error(`[Cache] Set Error for ${key}:`, err);
    }
};

/**
 * Delete data from Redis cache. Fails gracefully.
 * @param {string} key 
 */
export const deleteCache = async (key) => {
    if (!isRedisAvailable || !redisClient) return;
    try {
        await redisClient.del(key);
    } catch (err) {
        console.error(`[Cache] Delete Error for ${key}:`, err);
    }
};
