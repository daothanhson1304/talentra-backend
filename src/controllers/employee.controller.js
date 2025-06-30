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

exports.getEmployeesWithPagination = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      department = '',
      position = '',
    } = req.query;

    // Validate page and limit
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error:
          'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100',
      });
    }

    // Build query
    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by department
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }

    // Filter by position
    if (position) {
      query.position = { $regex: position, $options: 'i' };
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate skip value
    const skip = (pageNum - 1) * limitNum;

    // Execute queries
    const [employees, totalCount] = await Promise.all([
      Employee.find(query)
        .select('-createdAt -updatedAt -__v')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Employee.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      employees,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNum + 1 : null,
        prevPage: hasPrevPage ? pageNum - 1 : null,
      },
      filters: {
        search,
        department,
        position,
        sortBy,
        sortOrder,
      },
    });
  } catch (err) {
    console.error('Error in pagination:', err);
    res.status(500).json({ error: err.message });
  }
};
