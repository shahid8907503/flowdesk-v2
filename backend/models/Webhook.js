const mongoose = require('mongoose');

const WebhookSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  url: { type: String, required: true, trim: true },
  secret: { type: String, required: true }, // For signing requests to ensure source authenticity
  isActive: { type: Boolean, default: true },
  events: { type: [String], default: ['card.done'] } // Supported events
}, { timestamps: true });

module.exports = mongoose.model('Webhook', WebhookSchema);
