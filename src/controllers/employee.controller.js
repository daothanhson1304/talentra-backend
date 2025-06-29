const Employee = require('../models/employee.model');

exports.createEmployee = async (req, res) => {
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
    const { name, email, phone, salary, department, position } = req.body;
    if (!name || !email || !phone || !salary || !department || !position) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: [
          'name',
          'email',
          'phone',
          'salary',
          'department',
          'position',
        ],
        received: Object.keys(req.body),
      });
    }

    const newEmp = new Employee(req.body);
    console.log('New employee object:', newEmp);

    const saved = await newEmp.save();
    console.log('Saved employee:', saved);

    // Remove createdAt, updatedAt, and __v from response
    const { createdAt, updatedAt, __v, ...employeeResponse } = saved.toObject();
    res.status(201).json(employeeResponse);
  } catch (err) {
    console.error('Error creating employee:', err);

    // Handle validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: err.message,
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({
        error: 'Email already exists',
      });
    }

    res.status(500).json({ error: err.message });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select(
      '-createdAt -updatedAt -__v'
    );
    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAllEmployees = async (req, res) => {
  try {
    await Employee.deleteMany();
    res.status(200).json({ message: 'All employees deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
