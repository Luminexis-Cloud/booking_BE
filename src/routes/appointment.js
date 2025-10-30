const express = require('express');
const { body, query } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');

const router = express.Router();

// Validation rules
const createAppointmentValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid date'),
  body('endTime')
    .isISO8601()
    .withMessage('End time must be a valid date'),
  body('type')
    .optional()
    .isIn(['general', 'meeting', 'consultation', 'follow-up'])
    .withMessage('Type must be one of: general, meeting, consultation, follow-up'),
];

const updateAppointmentValidation = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid date'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid date'),
  body('type')
    .optional()
    .isIn(['general', 'meeting', 'consultation', 'follow-up'])
    .withMessage('Type must be one of: general, meeting, consultation, follow-up'),
];

const getAppointmentsValidation = [
  query('date')
    .isISO8601()
    .withMessage('Date must be a valid date format (YYYY-MM-DD)'),
];

// Routes
router.post('/appointments', authenticateToken, createAppointmentValidation, handleValidationErrors, appointmentController.createAppointment);
router.get('/appointments', authenticateToken, getAppointmentsValidation, handleValidationErrors, appointmentController.getUserAppointments);
router.put('/appointments/:appointmentId', authenticateToken, updateAppointmentValidation, handleValidationErrors, appointmentController.updateAppointment);
router.delete('/appointments/:appointmentId', authenticateToken, appointmentController.deleteAppointment);

module.exports = router;
