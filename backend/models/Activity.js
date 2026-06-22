const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: { type: String, required: true }, // 'create', 'update', 'delete', 'move', 'comment', etc.
  details: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Activity', ActivitySchema);
