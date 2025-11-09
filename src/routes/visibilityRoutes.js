const express = require("express");
const router = express.Router();
const visibilityController = require("../controllers/visibilityController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

// Dropdown options (managers + employees)
router.get("/options", visibilityController.getDropdownOptions.bind(visibilityController));

// Assign manager → employees mapping
router.post("/assign", visibilityController.assignVisibility.bind(visibilityController));

// Get all employees visible to a manager
router.get("/:viewerId", visibilityController.getVisibility.bind(visibilityController));

module.exports = router;
