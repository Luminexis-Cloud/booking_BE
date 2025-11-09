const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class VisibilityController {
    // 🔹 Assign employees to a manager (many-to-many)
    async assignVisibility(req, res, next) {
        try {
            const { viewerId, targetIds } = req.body; // viewer = manager, targets = employees
            const currentUser = req.user;

            if (!viewerId || !Array.isArray(targetIds)) {
                return res.status(400).json({ success: false, message: "Invalid request format." });
            }

            // Only Admin or SuperAdmin can configure visibility
            if (!["SuperAdmin", "Admin"].includes(currentUser.role.name)) {
                return res.status(403).json({ success: false, message: "Permission denied." });
            }

            // Verify both viewer and targets belong to same company
            const viewer = await prisma.user.findUnique({ where: { id: viewerId } });
            if (!viewer || viewer.companyId !== currentUser.companyId) {
                return res.status(400).json({ success: false, message: "Invalid manager selection." });
            }

            const validTargets = await prisma.user.findMany({
                where: { id: { in: targetIds }, companyId: currentUser.companyId },
            });
            if (!validTargets.length) {
                return res.status(400).json({ success: false, message: "No valid employees selected." });
            }

            // Remove old visibility links for that manager
            await prisma.employeeVisibility.deleteMany({
                where: { viewerId },
            });

            // Add new visibility links
            await prisma.employeeVisibility.createMany({
                data: validTargets.map((t) => ({
                    viewerId,
                    targetId: t.id,
                })),
                skipDuplicates: true,
            });

            res.json({
                success: true,
                message: `${validTargets.length} employees assigned to manager successfully.`,
            });
        } catch (error) {
            console.error("❌ assignVisibility:", error);
            next(error);
        }
    }

    // 🔹 Get employees visible to a specific manager
    async getVisibility(req, res, next) {
        try {
            const { viewerId } = req.params;
            const currentUser = req.user;

            // Managers can only query their own mappings
            if (currentUser.role.name === "Manager" && currentUser.id !== viewerId) {
                return res.status(403).json({ success: false, message: "Access denied." });
            }

            const vis = await prisma.employeeVisibility.findMany({
                where: { viewerId },
                include: { target: { include: { role: true, store: true } } },
            });

            res.json({
                success: true,
                employees: vis.map((v) => v.target),
            });
        } catch (error) {
            next(error);
        }
    }

    // 🔹 Get all managers and employees for dropdowns
    async getDropdownOptions(req, res, next) {
        try {
            const user = req.user;
            const companyId = user.companyId;

            // Managers = users with Manager role
            const managers = await prisma.user.findMany({
                where: {
                    companyId,
                    role: { name: "Manager" },
                },
                select: { id: true, firstName: true, lastName: true, email: true },
                orderBy: { firstName: "asc" },
            });

            // Employees = all non-admin users
            const employees = await prisma.user.findMany({
                where: {
                    companyId,
                    NOT: { role: { name: { in: ["SuperAdmin", "Admin"] } } },
                },
                select: { id: true, firstName: true, lastName: true, email: true },
                orderBy: { firstName: "asc" },
            });

            res.json({
                success: true,
                data: {
                    managers,
                    employees,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new VisibilityController();
