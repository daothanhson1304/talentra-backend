const express = require('express');
const router = express.Router();

const {
  createTask,
  getAllTasks,
  getTaskById,
  deleteAllTasks,
  deleteTaskById,
  updateTask,
  getTaskByEmployeeId,
} = require('../controllers/task.controller');

router.post('/', createTask);
router.get('/', getAllTasks);
router.delete('/', deleteAllTasks);
router.get('/:id', getTaskById);
router.delete('/:id', deleteTaskById);
router.put('/:id', updateTask);
router.get('/employee/:id', getTaskByEmployeeId);
module.exports = router;
