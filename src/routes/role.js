const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
// const { authenticate } = require("../middlewares/authMiddleware");

// All routes are protected
router.post("/roles", roleController.createRole);
router.get("/roles", roleController.getAllRoles);
router.get("/roles/:id", roleController.getRoleById);
router.put("/roles/:id", roleController.updateRole);
router.delete("/roles/:id", roleController.deleteRole);
router.post("/roles/assign-permissions", roleController.assignPermissions);
router.get("/permissions", roleController.getAllPermissions);

module.exports = router;
