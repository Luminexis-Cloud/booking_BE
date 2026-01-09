const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeeController");
const { authenticateToken } = require("../middlewares/auth");
const { handleValidationErrors } = require("../middlewares/validation");
const { body, param } = require("express-validator");

// =========================
// VALIDATION RULES
// =========================

// Create employee validation
const createEmployeeValidation = [
  body("firstName").notEmpty().withMessage("First name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("roleId").notEmpty().withMessage("Role ID is required"),
  body("companyId").notEmpty().withMessage("Company ID is required"),
  body("storeId")
    .optional()
    .isString()
    .withMessage("Store ID must be a string"),
];

// Common validation for :id params
const validateEmployeeId = [
  param("id").notEmpty().withMessage("Valid employee ID is required"),
];

// =========================
// EMPLOYEE ROUTES
// =========================

// CREATE employee
router.post(
  "/",
  authenticateToken,
  createEmployeeValidation,
  handleValidationErrors,
  employeeController.createEmployee.bind(employeeController)
);

// LIST all employees
router.get(
  "/",
  authenticateToken,
  employeeController.listEmployees.bind(employeeController)
);

// GET employee by ID
router.get(
  "/:id",
  authenticateToken,
  validateEmployeeId,
  handleValidationErrors,
  employeeController.getEmployeeById.bind(employeeController)
);

// UPDATE employee
router.put(
  "/:id",
  authenticateToken,
  validateEmployeeId,
  handleValidationErrors,
  employeeController.updateEmployee.bind(employeeController)
);

// TOGGLE employee (activate/deactivate)
router.patch(
  "/:id/toggle",
  authenticateToken,
  validateEmployeeId,
  handleValidationErrors,
  employeeController.toggleEmployeeStatus.bind(employeeController)
);

// DELETE employee
router.delete(
  "/:id",
  authenticateToken,
  validateEmployeeId,
  handleValidationErrors,
  employeeController.deleteEmployee.bind(employeeController)
);

router.post(
  "/:employeeId/:companyId/send-invite",
  authenticateToken,
  employeeController.sendEmployeeInvitation.bind(employeeController)
);

router.patch(
  "/:employeeId/credentials",
  authenticateToken,
  validateEmployeeId,
  employeeController.adminUpdateEmployeeCredentials.bind(employeeController)
);

router.post(
  "/employee-services",
  authenticateToken,
  [
    body("employeeId").notEmpty().withMessage("employeeId is required"),
    body("storeId").notEmpty().withMessage("storeId is required"),
    body("serviceIds")
      .isArray({ min: 1 })
      .withMessage("serviceIds must be a non-empty array"),
  ],
  handleValidationErrors,
  employeeController.addMultipleEmployeeServices
);

router.get(
  "/employee-services/:employeeId",
  authenticateToken,
  [param("employeeId").notEmpty()],
  handleValidationErrors,
  employeeController.getServicesByEmployee
);

router.post(
  "/:employeeId/schedule",
  authenticateToken,
  [body("employeeId").notEmpty().withMessage("employeeId is required")],
  employeeController.saveSchedule
);

router.get(
  "/:employeeId/schedule",
  authenticateToken,
  [body("employeeId").notEmpty().withMessage("employeeId is required")],
  employeeController.getSchedule
);

router.get(
  "/schedules/bulk",
  authenticateToken,
  [
    body("employeeIds")
      .exists()
      .withMessage("employeeIds is required")
      .isArray()
      .withMessage("employeeIds must be an array"),
  ],
  employeeController.getSchedules
);

module.exports = router;
