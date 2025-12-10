const express = require("express");
const router = express.Router();

const roleController = require("../controllers/roleController");
const { authenticateToken } = require("../middlewares/auth");

// Create Role
router.post("/:companyId", authenticateToken, roleController.createRole);

// Get All Roles
router.get("/", authenticateToken, roleController.getAllRoles);

// Get Single Role
router.get("/:id", authenticateToken, roleController.getRoleById);

// Update Role
router.put("/:id", authenticateToken, roleController.updateRole);

// Delete Role
router.delete("/:id", authenticateToken, roleController.deleteRole);

// =========================
//      PERMISSIONS
// =========================

// Assign Permissions to Role
router.post("/assign-permissions", authenticateToken, roleController.assignPermissions);

// Get All Permissions
router.get("/permissions", authenticateToken, roleController.getAllPermissions);

// =========================
//      VISIBILITY
// =========================

// Update Role Visibility
router.post("/update-visibility", authenticateToken, roleController.updateRoleVisibility);

// Get Available Users for Visibility
router.get("/available-users", authenticateToken, roleController.getAvailableUsers);

module.exports = router;
