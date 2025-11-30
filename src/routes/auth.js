const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middlewares/auth");
const { handleValidationErrors } = require("../middlewares/validation");

const router = express.Router();

// Check Email
const checkEmailValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
];

// Create Basic Account
const createAccountBasicValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("confirmPassword")
    .notEmpty()
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
];

//  Complete Company Setup
const completeSetupValidation = [
  body("userId").notEmpty().withMessage("userId is required"),
  body("phone")
    .isLength({ min: 10, max: 15 })
    .matches(/^[0-9]+$/)
    .withMessage("Phone must contain only numbers"),
  body("companyName").notEmpty().withMessage("Company name is required"),
  body("nickname").optional(),
  body("country").optional(),
  body("industry").optional(),
  body("teamMembersCount")
    .optional()
    .isNumeric()
    .withMessage("teamMembersCount must be a number"),
];

//  Signup Validation
const signupValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// Login validation
const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const updatePasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// OTP ROUTES
router.post(
  "/send-signup-otp",
  [body("email").notEmpty().isEmail().withMessage("Valid email is required")],
  handleValidationErrors,
  authController.sendSignupOtp
);

router.post(
  "/verify-signup-otp",
  [
    body("email").notEmpty().isEmail().withMessage("Valid email is required"),

    body("otp")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("OTP must be 6 digits"),
  ],
  handleValidationErrors,
  authController.verifySignupOtp
);

// Email Check
router.post(
  "/check-email",
  checkEmailValidation,
  handleValidationErrors,
  authController.checkEmail
);

// Create Account Basic
router.post(
  "/create-account-basic",
  createAccountBasicValidation,
  handleValidationErrors,
  authController.createAccountBasic
);

// Complete Company Setup
router.post(
  "/complete-company-setup",
  completeSetupValidation,
  handleValidationErrors,
  authController.completeCompanySetup
);

router.post(
  "/signup",
  signupValidation,
  handleValidationErrors,
  authController.signup
);

router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  authController.login
);

router.post(
  "/update-password",
  updatePasswordValidation,
  handleValidationErrors,
  authController.updatePassword
);

// ======================================================
// OPTIONAL ROUTES (for future use)
// ======================================================
// router.post('/refresh-token', refreshTokenValidation, handleValidationErrors, authController.refreshToken);
// router.post('/logout', authController.logout);
// router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;
