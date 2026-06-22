const http = require('http');
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { initSocket } = require('./config/socket');
const { initCronJobs } = require('./services/cronService');
const { initQueue } = require('./services/queueService');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

// Connect to Database & Redis
connectDB();
connectRedis();

// Initialise BullMQ Queue System
initQueue();

// Create HTTP server
const server = http.createServer(app);

// Initialise Socket.IO
initSocket(server);

// Initialise Cron Jobs
initCronJobs();

// Start Server listener
server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // We keep running in production but log it
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
