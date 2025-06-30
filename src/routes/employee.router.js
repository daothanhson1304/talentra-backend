const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getAllEmployees,
  deleteAllEmployees,
  getEmployeesWithPagination,
} = require('../controllers/employee.controller');

router.get('/', getAllEmployees);
router.get('/paginated', getEmployeesWithPagination);
router.post('/', createEmployee);
router.delete('/', deleteAllEmployees);

module.exports = router;
