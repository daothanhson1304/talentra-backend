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

    // Remove createdAt, updatedAt, and __v from response
    const { createdAt, updatedAt, __v, ...taskResponse } = task.toObject();
    res.status(201).json(taskResponse);
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
    const tasks = await Task.find().select('-createdAt -updatedAt -__v');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).select(
      '-createdAt -updatedAt -__v'
    );
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTaskByEmployeeId = async (req, res) => {
  try {
    const tasks = await Task.find({ employeeId: req.params.id }).select(
      '-createdAt -updatedAt -__v'
    );
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTaskById = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select('-createdAt -updatedAt -__v');
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

exports.updateTasks = async (req, res) => {
  try {
    const tasks = req.body;

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ message: 'Expected an array of tasks' });
    }

    const updatePromises = tasks.map(task => {
      const { _id, ...updates } = task;
      return Task.findByIdAndUpdate(_id, updates, { new: true }).select(
        '-createdAt -updatedAt -__v'
      );
    });

    const updatedTasks = await Promise.all(updatePromises);

    res.status(200).json(updatedTasks);
  } catch (error) {
    console.error('Error updating tasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getTasksByEmployeeAndMonth = async (req, res) => {
  try {
    const { id: employeeId } = req.params;
    const { month, year, status, importance } = req.query;

    // Validate employeeId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        error: 'Invalid employeeId format',
        received: employeeId,
      });
    }

    // Validate month and year
    if (!month || !year) {
      return res.status(400).json({
        error: 'Missing required query parameters',
        required: ['month', 'year'],
        received: { month, year },
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        error: 'Invalid month. Month must be between 1 and 12',
        received: month,
      });
    }

    if (yearNum < 1900 || yearNum > 2100) {
      return res.status(400).json({
        error: 'Invalid year. Year must be between 1900 and 2100',
        received: year,
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
    if (importance && !['low', 'medium', 'high'].includes(importance)) {
      return res.status(400).json({
        error: 'Invalid importance value',
        allowed: ['low', 'medium', 'high'],
        received: importance,
      });
    }

    // Create date range for the specified month
    const startDate = new Date(yearNum, monthNum - 1, 1); // First day of month
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999); // Last day of month

    console.log('Searching for tasks between:', startDate, 'and', endDate);

    // Build query object
    let query = {
      employeeId: employeeId,
      $or: [
        // Tasks scheduled for specific days in the month
        {
          day: {
            $gte: startDate,
            $lte: endDate,
          },
        },
        // Tasks created in the month (for tasks without specific day)
        {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      ],
    };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add importance filter if provided
    if (importance) {
      query.importance = importance;
    }

    // Find tasks for the employee within the specified month
    const tasks = await Task.find(query)
      .select('-createdAt -updatedAt -__v')
      .sort({ day: 1, createdAt: 1 }); // Sort by day first, then by creation date

    // Calculate statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      task => task.status === 'completed'
    ).length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const inProgressTasks = tasks.filter(
      task => task.status === 'in-progress'
    ).length;
    const cancelledTasks = tasks.filter(
      task => task.status === 'cancelled'
    ).length;

    res.status(200).json({
      month: monthNum,
      year: yearNum,
      dateRange: {
        startDate: startDate,
        endDate: endDate,
      },
      filters: {
        status: status || null,
        importance: importance || null,
      },
      statistics: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        cancelledTasks,
        completionRate:
          totalTasks > 0
            ? ((completedTasks / totalTasks) * 100).toFixed(2) + '%'
            : '0%',
      },
      tasks: tasks,
      employeeId,
    });
  } catch (error) {
    console.error('Error getting tasks by employee and month:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createBulkTasks = async (req, res) => {
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

    // Check if tasks array exists
    if (!req.body.tasks || !Array.isArray(req.body.tasks)) {
      return res.status(400).json({
        error: 'Missing or invalid tasks array',
        required: 'tasks (array)',
        received: typeof req.body.tasks,
      });
    }

    const tasks = req.body.tasks;

    // Validate array length
    if (tasks.length === 0) {
      return res.status(400).json({
        error: 'Tasks array is empty',
      });
    }

    if (tasks.length > 100) {
      return res.status(400).json({
        error: 'Too many tasks. Maximum allowed is 100',
        received: tasks.length,
        maxAllowed: 100,
      });
    }

    // Validate each task
    const requiredFields = ['title', 'description'];
    const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
    const validImportance = ['low', 'medium', 'high'];

    const validationErrors = [];
    const validTasks = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const errors = [];

      // Check required fields
      for (const field of requiredFields) {
        if (!task[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }

      // Validate employeeId if provided
      if (
        task.employeeId &&
        !mongoose.Types.ObjectId.isValid(task.employeeId)
      ) {
        errors.push('Invalid employeeId format');
      }

      // Validate status if provided
      if (task.status && !validStatuses.includes(task.status)) {
        errors.push(
          `Invalid status. Allowed values: ${validStatuses.join(', ')}`
        );
      }

      // Validate importance if provided
      if (task.importance && !validImportance.includes(task.importance)) {
        errors.push(
          `Invalid importance. Allowed values: ${validImportance.join(', ')}`
        );
      }

      // Validate slotCount if provided
      if (task.slotCount && (isNaN(task.slotCount) || task.slotCount < 1)) {
        errors.push('slotCount must be a positive number');
      }

      // Validate startSlot if provided
      if (task.startSlot && (isNaN(task.startSlot) || task.startSlot < 0)) {
        errors.push('startSlot must be a non-negative number');
      }

      // Validate day if provided
      if (task.day) {
        const day = new Date(task.day);
        if (isNaN(day.getTime())) {
          errors.push('Invalid day format');
        }
      }

      // Validate scheduled if provided
      if (task.scheduled !== undefined && typeof task.scheduled !== 'boolean') {
        errors.push('scheduled must be a boolean value');
      }

      if (errors.length > 0) {
        validationErrors.push({
          index: i,
          task: task,
          errors: errors,
        });
      } else {
        validTasks.push(task);
      }
    }

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation errors found',
        validationErrors: validationErrors,
        totalErrors: validationErrors.length,
        validTasks: validTasks.length,
      });
    }

    // Create tasks
    const createdTasks = [];
    const failedTasks = [];

    for (const task of validTasks) {
      try {
        const newTask = new Task(task);
        const savedTask = await newTask.save();

        // Remove createdAt, updatedAt, and __v from response
        const { createdAt, updatedAt, __v, ...taskResponse } =
          savedTask.toObject();
        createdTasks.push(taskResponse);
      } catch (err) {
        console.error('Error creating task:', err);
        failedTasks.push({
          task: task,
          error: err.message,
        });
      }
    }

    // Prepare response
    const response = {
      success: {
        totalCreated: createdTasks.length,
        tasks: createdTasks,
      },
    };

    if (failedTasks.length > 0) {
      response.failed = {
        totalFailed: failedTasks.length,
        tasks: failedTasks,
      };
    }

    // Determine status code
    let statusCode = 201;
    if (createdTasks.length === 0) {
      statusCode = 400;
    } else if (failedTasks.length > 0) {
      statusCode = 207; // Multi-Status
    }

    res.status(statusCode).json(response);
  } catch (err) {
    console.error('Error creating bulk tasks:', err);
    res.status(500).json({ error: err.message });
  }
};
