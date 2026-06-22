const mongoose = require('mongoose');

const TimeLogSchema = new mongoose.Schema({
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, default: 0 } // In seconds
}, { timestamps: true });

TimeLogSchema.index({ cardId: 1, startTime: 1 });

module.exports = mongoose.model('TimeLog', TimeLogSchema);
