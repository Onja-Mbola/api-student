const express = require('express');
const gradeController = require('../controllers/grade.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const router = express.Router();

router.get('/', authenticate, authorizeRoles('ADMIN', 'SCOLARITE'), gradeController.getAll);
router.get('/:id', authenticate, authorizeRoles('ADMIN', 'SCOLARITE', 'STUDENT'), gradeController.getById);
router.post('/', authenticate, authorizeRoles('ADMIN', 'SCOLARITE'), gradeController.create);
router.put('/:id', authenticate, authorizeRoles('ADMIN', 'SCOLARITE'), gradeController.update);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), gradeController.deleteGrade);
router.get('/student/:id', authenticate, gradeController.getByStudentId);
router.post('/send-bulletin', gradeController.sendBulletinByEmail);

module.exports = router;