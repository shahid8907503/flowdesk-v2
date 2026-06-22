const { Queue, Worker } = require('bullmq');
const axios = require('axios');
const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');
const { sendEmail } = require('../config/mailer');
const logger = require('../config/logger');

let backgroundQueue = null;
let backgroundWorker = null;

const initQueue = () => {
  try {
    const redisConnection = getRedisClient();

    // Create the BullMQ Queue
    backgroundQueue = new Queue('backgroundJobs', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000 // Start with 2s delay
        },
        removeOnComplete: true,
        removeOnFail: 100 // retain last 100 failed jobs for audit
      }
    });

    // Create the Background Worker
    backgroundWorker = new Worker('backgroundJobs', async (job) => {
      const { type, data } = job.data;
      logger.info(`Processing background job: ${job.name} (Type: ${type}, JobID: ${job.id})`);

      switch (type) {
        case 'email': {
          const { to, subject, html } = data;
          await sendEmail({ to, subject, html });
          logger.info(`Background email dispatched successfully to ${to}`);
          break;
        }

        case 'webhook': {
          const { url, payload, secret, event } = data;
          const stringPayload = JSON.stringify(payload);
          const signature = crypto
            .createHmac('sha256', secret)
            .update(stringPayload)
            .digest('hex');

          // Send HTTP POST webhook payload
          const response = await axios.post(url, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-FlowDesk-Signature': signature,
              'X-FlowDesk-Event': event || 'card.done'
            },
            timeout: 5000
          });
          logger.info(`Background webhook delivered to ${url} (Status: ${response.status})`);
          break;
        }

        case 'cleanup': {
          const AuditLog = require('../models/AuditLog');
          // Archive or remove logs older than 90 days
          const cutOffDate = new Date();
          cutOffDate.setDate(cutOffDate.getDate() - 90);
          const deleteResult = await AuditLog.deleteMany({ timestamp: { $lt: cutOffDate } });
          logger.info(`Periodic cleanups complete. Removed ${deleteResult.deletedCount} old audit logs.`);
          break;
        }

        default:
          logger.warn(`Unknown background job type: ${type}`);
      }
    }, {
      connection: redisConnection,
      concurrency: 5 // Process up to 5 concurrent jobs on this node
    });

    backgroundWorker.on('completed', (job) => {
      logger.info(`Job completed successfully: ${job.id}`);
    });

    backgroundWorker.on('failed', (job, err) => {
      logger.error(`Job failed: ${job?.id}. Error: ${err.message}`);
    });

    logger.info('BullMQ background worker started successfully');
  } catch (error) {
    logger.error('Failed to initialize BullMQ service:', error);
  }
};

const addJob = async (type, name, data, delayMs = 0) => {
  if (!backgroundQueue) {
    logger.warn(`Queue system not initialized. Running job "${name}" synchronously.`);
    // Synchronous fallback
    if (type === 'email') {
      return sendEmail(data);
    } else if (type === 'webhook') {
      const { url, payload, secret, event } = data;
      const stringPayload = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', secret).update(stringPayload).digest('hex');
      return axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-FlowDesk-Signature': signature,
          'X-FlowDesk-Event': event || 'card.done'
        },
        timeout: 5000
      });
    }
    return;
  }

  const options = {};
  if (delayMs > 0) {
    options.delay = delayMs;
  }

  await backgroundQueue.add(name, { type, data }, options);
};

module.exports = { initQueue, addJob };
