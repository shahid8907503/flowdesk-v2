const crypto = require('crypto');
const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
  req.id = crypto.randomUUID();
  const startTime = Date.now();

  logger.info({
    reqId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip
  }, `Incoming request: ${req.method} ${req.url}`);

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      reqId: req.id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    }, `Request completed: ${req.method} ${req.url} -> ${res.statusCode} in ${duration}ms`);
  });

  next();
};

module.exports = requestLogger;
