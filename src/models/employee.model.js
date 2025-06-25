const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  salary: { type: Number, required: true },
  department: { type: String, required: true },
  position: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  role: { type: String, default: 'employee' },
  avatar: { type: String, default: '' },
});

module.exports = mongoose.model('Employee', employeeSchema);
