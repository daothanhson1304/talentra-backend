const express = require('express');
const router = express.Router();

const {
  createTask,
  getAllTasks,
  getTaskById,
  deleteAllTasks,
  deleteTaskById,
  updateTaskById,
  updateTasks,
  getTaskByEmployeeId,
  getTasksByEmployeeAndMonth,
  createBulkTasks,
} = require('../controllers/task.controller');

router.post('/', createTask);
router.post('/bulk', createBulkTasks);
router.get('/', getAllTasks);
router.delete('/', deleteAllTasks);
router.put('/', updateTasks);
router.get('/:id', getTaskById);
router.delete('/:id', deleteTaskById);
router.put('/:id', updateTaskById);
router.get('/employee/:id', getTaskByEmployeeId);
router.get('/employee/:id/monthly', getTasksByEmployeeAndMonth);
module.exports = router;
