const express = require("express");
const { body, query, param } = require("express-validator");
const appointmentController = require("../controllers/appointmentController");
const { authenticateToken } = require("../middlewares/auth");
const { handleValidationErrors } = require("../middlewares/validation");

const router = express.Router();

// Validation rules
const allowedRecurrence = ["daily", "weekly", "monthly", "yearly"];
const allowedSmsSchedule = ["instant", "one_day_before", "two_hours_before"];
const allowedColors = [
  "gold",
  "blue",
  "green",
  "yellow",
  "red",
  "teal",
  "beige",
  "gray",
];
const allowedDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/* ───────────────────────────────────────────── */
/* CREATE APPOINTMENT */
/* ───────────────────────────────────────────── */
const createAppointmentValidation = [
  /* ───── BASIC ───── */
  body("employeeId")
    .notEmpty()
    .withMessage("employeeId is required")
    .isString(),

  body("storeId")
    .notEmpty()
    .withMessage("storeId is required")
    .isString(),

  body("clientId")
    .optional()
    .isString(),

  body("color")
    .optional()
    .isIn(allowedColors)
    .withMessage(`Color must be one of: ${allowedColors.join(", ")}`),

  /* ───── TIME ───── */
  body("startTime")
    .notEmpty()
    .isISO8601()
    .withMessage("startTime must be a valid ISO date"),

  body("endTime")
    .notEmpty()
    .isISO8601()
    .withMessage("endTime must be a valid ISO date")
    .custom((endTime, { req }) => {
      if (new Date(endTime) <= new Date(req.body.startTime)) {
        throw new Error("endTime must be after startTime");
      }
      return true;
    }),

  /* ───── SERVICES ───── */
  body("serviceIds")
    .isArray({ min: 1 })
    .withMessage("serviceIds must be a non-empty array"),

  body("serviceIds.*")
    .isString()
    .withMessage("Each serviceId must be a string"),

  /* ───── RECURRENCE (OPTIONAL) ───── */
  body("recurrence")
    .optional()
    .isObject()
    .withMessage("recurrence must be an object"),

  body("recurrence.type")
    .if(body("recurrence").exists())
    .isIn(["daily", "weekly", "monthly", "yearly"])
    .withMessage("Invalid recurrence type"),

  body("recurrence.interval")
    .optional()
    .isInt({ min: 1 })
    .withMessage("recurrence.interval must be at least 1"),

  body("recurrence.count")
    .optional()
    .isInt({ min: 1 })
    .withMessage("recurrence.count must be at least 1"),

  body("recurrence.days")
    .optional()
    .isArray({ min: 1 })
    .withMessage("recurrence.days must be a non-empty array"),

  body("recurrence.days.*")
    .optional()
    .isIn(allowedDays)
    .withMessage("Invalid weekday value"),

  body("recurrence.isInstantConfirmation")
    .optional()
    .isBoolean()
    .withMessage("isInstantConfirmation must be boolean"),
];


/* ───────────────────────────────────────────── */
/* UPDATE APPOINTMENT */
/* ───────────────────────────────────────────── */
const updateAppointmentValidation = [
  param("appointmentId").notEmpty().withMessage("Appointment ID is required"),
];

/* ───────────────────────────────────────────── */
/* GET APPOINTMENTS */
/* ───────────────────────────────────────────── */
const getAppointmentsValidation = [
  query("storeId").isString().notEmpty(),
  body("employeeIds")
    .optional()
    .isArray(),
  body("employeeIds.*")
    .isString(),
];

// Routes

router.post(
  "/appointments",
  authenticateToken,
  createAppointmentValidation,
  handleValidationErrors,
  appointmentController.createAppointment
);

router.get(
  "/appointments",
  authenticateToken,
  getAppointmentsValidation,
  handleValidationErrors,
  appointmentController.getUserAppointments
);

router.put(
  "/appointments/:appointmentId",
  authenticateToken,
  updateAppointmentValidation,
  handleValidationErrors,
  appointmentController.updateAppointment
);

router.put(
  "/appointments/:appointmentId",
  authenticateToken,
  updateAppointmentValidation,
  handleValidationErrors,
  appointmentController.get
);

router.delete(
  "/appointments/:appointmentId",
  authenticateToken,
  appointmentController.deleteAppointment
);

module.exports = router;
