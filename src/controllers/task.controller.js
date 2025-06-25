const Task = require('../models/task.model');
const mongoose = require('mongoose');

exports.createTask = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);

    // Check if req.body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Request body is empty or undefined',
        contentType: req.headers['content-type'],
        body: req.body,
      });
    }

    // Validate required fields
    const { title, description, status, employeeId } = req.body;
    if (!title || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'description'],
        received: Object.keys(req.body),
      });
    }

    // Validate status if provided
    if (
      status &&
      !['pending', 'in-progress', 'completed', 'cancelled'].includes(status)
    ) {
      return res.status(400).json({
        error: 'Invalid status value',
        allowed: ['pending', 'in-progress', 'completed', 'cancelled'],
        received: status,
      });
    }

    // Validate importance if provided
    if (
      req.body.importance &&
      !['low', 'medium', 'high'].includes(req.body.importance)
    ) {
      return res.status(400).json({
        error: 'Invalid importance value',
        allowed: ['low', 'medium', 'high'],
        received: req.body.importance,
      });
    }

    // Validate employeeId if provided
    if (employeeId && !mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        error: 'Invalid employeeId format',
        received: employeeId,
      });
    }

    const task = await Task.create(req.body);
    console.log('Created task:', task);

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.message,
      });
    }

    res.status(500).json({ error: error.message });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTaskByEmployeeId = async (req, res) => {
  try {
    const tasks = await Task.find({ employeeId: req.params.id });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTaskById = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAllTasks = async (req, res) => {
  try {
    await Task.deleteMany();
    res.status(200).json({ message: 'All tasks deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
