const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const { authenticate } = require("../middlewares/authMiddleware");

// All routes are protected
router.post("/roles", authenticate, roleController.createRole);
router.get("/roles", authenticate, roleController.getAllRoles);
router.get("/roles/:id", authenticate, roleController.getRoleById);
router.put("/roles/:id", authenticate, roleController.updateRole);
router.delete("/roles/:id", authenticate, roleController.deleteRole);
router.post("/roles/assign-permissions", authenticate, roleController.assignPermissions);
router.get("/permissions", authenticate, roleController.getAllPermissions);

module.exports = router;
