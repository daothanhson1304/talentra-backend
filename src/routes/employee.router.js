const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getAllEmployees,
  deleteAllEmployees,
  getEmployeesWithPagination,
  createBulkEmployees,
  getEmployeeById,
} = require('../controllers/employee.controller');

router.get('/', getAllEmployees);
router.get('/paginated', getEmployeesWithPagination);
router.get('/:id', getEmployeeById);
router.post('/', createEmployee);
router.post('/bulk', createBulkEmployees);
router.delete('/', deleteAllEmployees);

module.exports = router;
