import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient, { isRedisAvailable } from './redis.js';

// We wrap the configuration to handle the case where Redis might not be available at startup
const getRateLimitOptions = (windowMs, max, message) => {
    const options = {
        windowMs,
        max,
        message,
        standardHeaders: true,
        legacyHeaders: false,
        validate: false,
    };

    // Only use RedisStore if Redis is actually connected
    if (redisClient.status !== 'mock' && isRedisAvailable) {
        options.store = new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
        });
    }

    return options;
};

export const engagementLimiter = rateLimit(getRateLimitOptions(10 * 1000, 10, { message: "Too many actions. Please wait 10 seconds." }));
export const analyticsLimiter = rateLimit(getRateLimitOptions(15 * 60 * 1000, 100, { message: "Too many analytics requests." }));
