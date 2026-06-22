const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#4f46e5' }, // Default Indigo hex
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Board', BoardSchema);
