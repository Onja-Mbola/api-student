const express = require('express');
const userController = require('../controllers/user.controller');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

router.get('/email/:email', authenticate ,userController.getUserByEmail);
router.get('/', authenticate, authorizeRoles('ADMIN', 'SCOLARITE'),userController.getAllUsers);
router.get('/students/all', authenticate, authorizeRoles('ADMIN', 'SCOLARITE'), userController.getAllStudents);
router.get('/:id', authenticate, userController.getUserById);
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), userController.deleteUser);

module.exports = router;
