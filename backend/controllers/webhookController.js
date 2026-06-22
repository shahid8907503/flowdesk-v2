const Webhook = require('../models/Webhook');
const { logAction } = require('../services/auditService');
const { webhookSchema } = require('../utils/validators');

const createWebhook = async (req, res, next) => {
  try {
    const parsedData = webhookSchema.parse(req.body);
    const { workspaceId } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'Workspace ID is required' });
    }

    const webhook = await Webhook.create({
      workspaceId,
      url: parsedData.url,
      secret: parsedData.secret,
      events: parsedData.events || ['card.done']
    });

    await logAction(req.user._id, 'webhook.create', req, { workspaceId, webhookId: webhook._id });

    res.status(201).json({
      success: true,
      webhook
    });
  } catch (error) {
    next(error);
  }
};

const getWebhooks = async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'Workspace ID is required' });
    }

    const webhooks = await Webhook.find({ workspaceId });
    res.status(200).json({
      success: true,
      webhooks
    });
  } catch (error) {
    next(error);
  }
};

const deleteWebhook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const webhook = await Webhook.findById(id);
    if (!webhook) {
      return res.status(404).json({ success: false, message: 'Webhook not found' });
    }

    await Webhook.deleteOne({ _id: id });
    await logAction(req.user._id, 'webhook.delete', req, { workspaceId: webhook.workspaceId, webhookId: id });

    res.status(200).json({
      success: true,
      message: 'Webhook configuration deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWebhook,
  getWebhooks,
  deleteWebhook
};
