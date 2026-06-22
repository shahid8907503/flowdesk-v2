const crypto = require('crypto');
const Webhook = require('../models/Webhook');
const { addJob } = require('./queueService');
const logger = require('../config/logger');

const triggerWebhook = async (workspaceId, event, payload) => {
  try {
    const webhooks = await Webhook.find({ workspaceId, isActive: true, events: event });

    for (const hook of webhooks) {
      // Add webhook task to background queue for execution
      await addJob('webhook', `webhook-job:${hook._id}`, {
        url: hook.url,
        payload,
        secret: hook.secret,
        event
      });
      logger.info(`Queued outgoing webhook job for workspace ${workspaceId} to endpoint ${hook.url}`);
    }
  } catch (error) {
    logger.error(`Error queuing webhooks for workspace ${workspaceId}:`, error);
  }
};

module.exports = { triggerWebhook };
