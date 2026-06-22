const mongoose = require('mongoose');

const DeviceSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ipAddress: { type: String, default: '' },
  deviceType: { type: String, default: 'Desktop' }, // Desktop, Mobile, Tablet
  browser: { type: String, default: 'Unknown' },
  os: { type: String, default: 'Unknown' },
  userAgent: { type: String, default: '' },
  refreshToken: { type: String, required: true }, // The associated session refresh token
  isActive: { type: Boolean, default: true },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for query optimization
DeviceSessionSchema.index({ userId: 1, isActive: 1 });
DeviceSessionSchema.index({ refreshToken: 1 });

module.exports = mongoose.model('DeviceSession', DeviceSessionSchema);
