const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // e.g. 'auth.login', 'card.move', 'timer.start', 'role.update', 'board.update'
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for searchable logs
AuditLogSchema.index({ userId: 1, action: 1, timestamp: -1 });
AuditLogSchema.index({ 'details.workspaceId': 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
