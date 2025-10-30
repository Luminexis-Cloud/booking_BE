const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');

const router = express.Router();

// Validation rules for signup
const signupValidation = [
  body('firstName')
    .notEmpty()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be between 1 and 50 characters'),
  body('lastName')
    .notEmpty()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be between 1 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .notEmpty()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required')
];

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

router.post('/send-signup-otp', [
  body('phoneNumber')
    .notEmpty()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required')
], handleValidationErrors, authController.sendSignupOtp);

router.post('/verify-signup-otp', [
  body('phoneNumber')
    .notEmpty()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits')
], handleValidationErrors, authController.verifySignupOtp);

router.post('/signup', signupValidation, handleValidationErrors, authController.signup);

router.post('/login', loginValidation, handleValidationErrors, authController.login);


// router.post('/refresh-token', refreshTokenValidation, handleValidationErrors, authController.refreshToken);
// router.post('/logout', authController.logout);
// router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;