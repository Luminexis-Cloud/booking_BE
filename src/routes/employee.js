const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

// Employee CRUD endpoints
router.post("/", employeeController.createEmployee.bind(employeeController));
router.get("/", employeeController.listEmployees.bind(employeeController));
router.get("/:id", employeeController.getEmployeeById.bind(employeeController));
router.put("/:id", employeeController.updateEmployee.bind(employeeController));
router.patch("/:id/toggle", employeeController.toggleEmployeeStatus.bind(employeeController));
router.delete("/:id", employeeController.deleteEmployee.bind(employeeController));

module.exports = router;
