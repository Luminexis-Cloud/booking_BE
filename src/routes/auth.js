const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middlewares/auth");
const { handleValidationErrors } = require("../middlewares/validation");

const router = express.Router();


// ======================================================
// VALIDATIONS
// ======================================================

// STEP 1 — Check Email
const checkEmailValidation = [
  body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
];

// STEP 2 — Create Basic Account
const createAccountBasicValidation = [
  body("name")
      .notEmpty()
      .withMessage("Name is required"),
  body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
  body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  body("confirmPassword")
      .notEmpty()
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords do not match"),
];

// STEP 3 — Complete Company Setup
const completeSetupValidation = [
  body("userId")
      .notEmpty()
      .withMessage("userId is required"),
  body("phone")
      .notEmpty()
      .isMobilePhone("any")
      .withMessage("Valid phone number is required"),
  body("companyName")
      .notEmpty()
      .withMessage("Company name is required"),
  body("nickname")
      .optional(),
  body("country")
      .optional(),
  body("industry")
      .optional(),
  body("teamMembersCount")
      .optional()
      .isNumeric()
      .withMessage("teamMembersCount must be a number"),
];

// LEGACY / OLD Signup Validation
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
  body("password")
      .notEmpty()
      .withMessage("Password is required"),
];


// ======================================================
// OTP ROUTES (unchanged)
// ======================================================
router.post(
    "/send-signup-otp",
    [
      body("phoneNumber")
          .notEmpty()
          .isMobilePhone("any")
          .withMessage("Valid phone number is required"),
    ],
    handleValidationErrors,
    authController.sendSignupOtp
);

router.post(
    "/verify-signup-otp",
    [
      body("phoneNumber")
          .notEmpty()
          .isMobilePhone("any")
          .withMessage("Valid phone number is required"),
      body("otp")
          .isLength({ min: 6, max: 6 })
          .isNumeric()
          .withMessage("OTP must be 6 digits"),
    ],
    handleValidationErrors,
    authController.verifySignupOtp
);


// ======================================================
// NEW MULTI-STEP SIGNUP ROUTES
// ======================================================

// STEP 1 — Email Check
router.post(
    "/check-email",
    checkEmailValidation,
    handleValidationErrors,
    authController.checkEmail
);

// STEP 2 — Create Account Basic
router.post(
    "/create-account-basic",
    createAccountBasicValidation,
    handleValidationErrors,
    authController.createAccountBasic
);

// STEP 3 — Complete Company Setup
router.post(
    "/complete-company-setup",
    completeSetupValidation,
    handleValidationErrors,
    authController.completeCompanySetup
);


// ======================================================
// ORIGINAL SIGNUP & LOGIN ROUTES
// ======================================================

router.post("/signup", signupValidation, handleValidationErrors, authController.signup);

router.post("/login", loginValidation, handleValidationErrors, authController.login);


// ======================================================
// OPTIONAL ROUTES (for future use)
// ======================================================
// router.post('/refresh-token', refreshTokenValidation, handleValidationErrors, authController.refreshToken);
// router.post('/logout', authController.logout);
// router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;
