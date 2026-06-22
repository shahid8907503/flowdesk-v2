const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
  columnId: { type: mongoose.Schema.Types.ObjectId, ref: 'Column', required: true },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  position: { type: Number, required: true },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  dueDate: { type: Date },
  isArchived: { type: Boolean, default: false },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  storyPoints: { type: Number, default: 0 }
}, { timestamps: true });

CardSchema.index({ boardId: 1, columnId: 1, position: 1 });

module.exports = mongoose.model('Card', CardSchema);
