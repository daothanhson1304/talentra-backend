const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getAllEmployees,
  deleteAllEmployees,
} = require('../controllers/employee.controller');

router.get('/', getAllEmployees);

router.post('/', createEmployee);

router.delete('/', deleteAllEmployees);

module.exports = router;
