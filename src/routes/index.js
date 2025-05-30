const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const courseRoutes = require('./course.routes');
const gradeRoutes = require('./grade.routes');

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/course', courseRoutes);
router.use('/grade', gradeRoutes);

module.exports = router;