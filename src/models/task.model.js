const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  scheduled: { type: Boolean, default: false },
  day: { type: Date },
  slotCount: { type: Number, default: 1 },
  startSlot: { type: Number, default: 0 },
  importance: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
});

module.exports = mongoose.model('Task', taskSchema);
