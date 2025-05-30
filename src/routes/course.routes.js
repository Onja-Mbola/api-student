const express = require('express');
const courseController = require('../controllers/course.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const router = express.Router();

router.get('/', authenticate, courseController.getAll);
router.get('/:id', authenticate, courseController.getById);
router.post('/', authenticate, authorizeRoles('ADMIN', 'SCOLARITE'), courseController.create);
router.put('/:id', authenticate, authorizeRoles('ADMIN', 'SCOLARITE'), courseController.update);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), courseController.deleteCourse);

module.exports = router;