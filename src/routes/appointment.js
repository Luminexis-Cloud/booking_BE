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
  body("employeeId")
  .notEmpty()
  .withMessage("employeeId is required")
  .isString(),
  
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters"),

  body("notes")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Notes must be less than 500 characters"),

  body("startTime")
    .notEmpty()
    .isISO8601()
    .withMessage("Start time must be a valid ISO date"),

  body("endTime")
    .notEmpty()
    .isISO8601()
    .withMessage("End time must be a valid ISO date")
    .custom((endTime, { req }) => {
      if (new Date(endTime) <= new Date(req.body.startTime)) {
        throw new Error("End time must be after start time");
      }
      return true;
    }),

  body("storeId").notEmpty().withMessage("Store ID is required"),

  body("clientId").optional().isString(),

  body("color")
    .optional()
    .isIn(allowedColors)
    .withMessage(`Color must be one of: ${allowedColors.join(", ")}`),

  /* ───── Recurrence ───── */
  body("isRecurring")
    .optional()
    .isBoolean()
    .withMessage("isRecurring must be boolean"),

  body("recurrence")
    .if(body("isRecurring").equals("true"))
    .isIn(allowedRecurrence)
    .withMessage(`Recurrence must be one of: ${allowedRecurrence.join(", ")}`),

  body("recurrenceConfig")
    .if(body("isRecurring").equals("true"))
    .isObject()
    .withMessage("recurrenceConfig must be an object"),

  body("recurrenceConfig.interval")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Interval must be at least 1"),

  body("recurrenceConfig.repeatTimes")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Repeat times must be at least 1"),

  body("recurrenceConfig.daysOfWeek")
    .optional()
    .isArray({ min: 1 })
    .withMessage("daysOfWeek must be a non-empty array"),

  body("recurrenceConfig.daysOfWeek.*")
    .optional()
    .isIn(allowedDays)
    .withMessage(`Invalid weekday value`),

  /* ───── SMS ───── */
  body("sendSms").optional().isBoolean().withMessage("sendSms must be boolean"),

  body("smsSchedule")
    .if(body("sendSms").equals("true"))
    .isIn(allowedSmsSchedule)
    .withMessage(
      `smsSchedule must be one of: ${allowedSmsSchedule.join(", ")}`
    ),
];

/* ───────────────────────────────────────────── */
/* UPDATE APPOINTMENT */
/* ───────────────────────────────────────────── */
const updateAppointmentValidation = [
  param("appointmentId").notEmpty().withMessage("Appointment ID is required"),

  body("title")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters"),

  body("notes")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Notes must be less than 500 characters"),

  body("startTime")
    .optional()
    .isISO8601()
    .withMessage("Start time must be a valid ISO date"),

  body("endTime")
    .optional()
    .isISO8601()
    .withMessage("End time must be a valid ISO date"),

  body("color").optional().isIn(allowedColors),

  body("isRecurring").optional().isBoolean(),

  body("recurrence").optional().isIn(allowedRecurrence),

  body("sendSms").optional().isBoolean(),

  body("smsSchedule").optional().isIn(allowedSmsSchedule),
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

router.delete(
  "/appointments/:appointmentId",
  authenticateToken,
  appointmentController.deleteAppointment
);

module.exports = router;
