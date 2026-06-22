const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;

const connectRedis = () => {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  const config = {
    maxRetriesPerRequest: null, // Critical requirement for BullMQ
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  };

  if (redisUrl) {
    logger.info('Attempting Redis connection using REDIS_URL');
    redisClient = new Redis(redisUrl, config);
  } else {
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = process.env.REDIS_PORT || 6379;
    const password = process.env.REDIS_PASSWORD || null;

    const fullConfig = {
      ...config,
      host,
      port
    };

    if (password) {
      fullConfig.password = password;
    }

    logger.info(`Attempting Redis connection at ${host}:${port}`);
    redisClient = new Redis(fullConfig);
  }

  redisClient.on('connect', () => {
    logger.info('Successfully connected to Redis instance');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis client connection error:', err);
  });

  return redisClient;
};

const getRedisClient = () => {
  if (!redisClient) {
    return connectRedis();
  }
  return redisClient;
};

module.exports = { connectRedis, getRedisClient };
