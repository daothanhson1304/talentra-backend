const Employee = require('../models/employee.model');
const mongoose = require('mongoose');

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
    const {
      name,
      email,
      phone,
      salary,
      department,
      position,
      dateOfBirth,
      address,
      city,
      country,
    } = req.body;
    if (
      !name ||
      !email ||
      !phone ||
      !salary ||
      !department ||
      !position ||
      !dateOfBirth ||
      !address ||
      !city ||
      !country
    ) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: [
          'name',
          'email',
          'phone',
          'salary',
          'department',
          'position',
          'dateOfBirth',
          'address',
          'city',
          'country',
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

exports.createBulkEmployees = async (req, res) => {
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

    // Check if employees array exists
    if (!req.body.employees || !Array.isArray(req.body.employees)) {
      return res.status(400).json({
        error: 'Missing or invalid employees array',
        required: 'employees (array)',
        received: typeof req.body.employees,
      });
    }

    const employees = req.body.employees;

    // Validate array length
    if (employees.length === 0) {
      return res.status(400).json({
        error: 'Employees array is empty',
      });
    }

    if (employees.length > 100) {
      return res.status(400).json({
        error: 'Too many employees. Maximum allowed is 100',
        received: employees.length,
        maxAllowed: 100,
      });
    }

    // Validate each employee
    const requiredFields = [
      'name',
      'email',
      'phone',
      'salary',
      'department',
      'position',
      'dateOfBirth',
      'address',
      'city',
      'country',
    ];

    const validationErrors = [];
    const validEmployees = [];

    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const errors = [];

      // Check required fields
      for (const field of requiredFields) {
        if (!employee[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }

      // Validate email format
      if (
        employee.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)
      ) {
        errors.push('Invalid email format');
      }

      // Validate salary
      if (employee.salary && (isNaN(employee.salary) || employee.salary < 0)) {
        errors.push('Salary must be a positive number');
      }

      // Validate dateOfBirth
      if (employee.dateOfBirth) {
        const dateOfBirth = new Date(employee.dateOfBirth);
        if (isNaN(dateOfBirth.getTime())) {
          errors.push('Invalid dateOfBirth format');
        }
      }

      if (errors.length > 0) {
        validationErrors.push({
          index: i,
          employee: employee,
          errors: errors,
        });
      } else {
        validEmployees.push(employee);
      }
    }

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation errors found',
        validationErrors: validationErrors,
        totalErrors: validationErrors.length,
        validEmployees: validEmployees.length,
      });
    }

    // Create employees
    const createdEmployees = [];
    const duplicateEmails = [];
    const failedEmployees = [];

    for (const employee of validEmployees) {
      try {
        // Check if email already exists
        const existingEmployee = await Employee.findOne({
          email: employee.email,
        });
        if (existingEmployee) {
          duplicateEmails.push({
            email: employee.email,
            name: employee.name,
          });
          continue;
        }

        const newEmployee = new Employee(employee);
        const savedEmployee = await newEmployee.save();

        // Remove createdAt, updatedAt, and __v from response
        const { createdAt, updatedAt, __v, ...employeeResponse } =
          savedEmployee.toObject();
        createdEmployees.push(employeeResponse);
      } catch (err) {
        console.error('Error creating employee:', err);
        failedEmployees.push({
          employee: employee,
          error: err.message,
        });
      }
    }

    // Prepare response
    const response = {
      success: {
        totalCreated: createdEmployees.length,
        employees: createdEmployees,
      },
    };

    if (duplicateEmails.length > 0) {
      response.duplicates = {
        totalDuplicates: duplicateEmails.length,
        emails: duplicateEmails,
      };
    }

    if (failedEmployees.length > 0) {
      response.failed = {
        totalFailed: failedEmployees.length,
        employees: failedEmployees,
      };
    }

    // Determine status code
    let statusCode = 201;
    if (createdEmployees.length === 0) {
      statusCode = 400;
    } else if (duplicateEmails.length > 0 || failedEmployees.length > 0) {
      statusCode = 207; // Multi-Status
    }

    res.status(statusCode).json(response);
  } catch (err) {
    console.error('Error creating bulk employees:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate employee ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid employee ID format',
        received: id,
      });
    }

    // Find employee by ID
    const employee = await Employee.findById(id).select('-updatedAt -__v');

    if (!employee) {
      return res.status(404).json({
        error: 'Employee not found',
        employeeId: id,
      });
    }

    res.status(200).json(employee);
  } catch (err) {
    console.error('Error getting employee by ID:', err);
    res.status(500).json({ error: err.message });
  }
};
