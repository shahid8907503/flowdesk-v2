const mongoose = require('mongoose');

const WorkspaceMemberSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    enum: ['Super Admin', 'Workspace Admin', 'Editor', 'Viewer'],
    default: 'Editor'
  }
}, { timestamps: true });

// Ensure unique composite index for a user in a workspace
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('WorkspaceMember', WorkspaceMemberSchema);
