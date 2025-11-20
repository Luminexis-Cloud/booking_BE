const express = require("express");
const router = express.Router();

const roleController = require("../controllers/roleController");
const { authenticateToken } = require("../middlewares/auth");

// Create Role
router.post("/roles", authenticateToken, roleController.createRole);

// Get All Roles
router.get("/roles", authenticateToken, roleController.getAllRoles);

// Assign Permissions
router.post("/roles/assign-permissions", authenticateToken, roleController.assignPermissions);

// Update Visibility
router.post("/roles/update-visibility", authenticateToken, roleController.updateRoleVisibility);

// Available Users for Role Visibility
router.get("/roles/available-users", authenticateToken, roleController.getAvailableUsers);

// Get All Permissions
router.get("/permissions", authenticateToken, roleController.getAllPermissions);

// Get Single Role
router.get("/roles/:id", authenticateToken, roleController.getRoleById);

// Update Role
router.put("/roles/:id", authenticateToken, roleController.updateRole);

// Delete Role
router.delete("/roles/:id", authenticateToken, roleController.deleteRole);

module.exports = router;
