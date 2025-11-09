const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * RoleController
 * Handles role management & permission assignment
 * Includes CRUD operations for roles
 */
class RoleController {
    // 1️⃣ Create a new role (company scoped)
    async createRole(req, res, next) {
        try {
            const { name, description, userLimit, permissionIds } = req.body;
            const companyId = req.user.companyId;

            // Prevent duplicate role in same company
            const existing = await prisma.role.findFirst({
                where: { name, companyId },
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: "Role with this name already exists for this company",
                });
            }

            const role = await prisma.role.create({
                data: {
                    name,
                    description,
                    userLimit: userLimit || 10,
                    companyId,
                },
            });

            // If permissions assigned
            if (permissionIds && permissionIds.length > 0) {
                const rolePermissions = permissionIds.map((pid) => ({
                    roleId: role.id,
                    permissionId: pid,
                }));
                await prisma.rolePermission.createMany({
                    data: rolePermissions,
                    skipDuplicates: true,
                });
            }

            res.status(201).json({
                success: true,
                message: "Role created successfully",
                data: role,
            });
        } catch (error) {
            console.error("Role Create Error:", error);
            next(error);
        }
    }

    // 2️⃣ Get all roles for company
    async getAllRoles(req, res, next) {
        try {
            const companyId = req.user.companyId;

            const roles = await prisma.role.findMany({
                where: { companyId },
                include: {
                    rolePermissions: {
                        include: { permission: true },
                    },
                    users: { select: { id: true, firstName: true, lastName: true } },
                },
            });

            res.json({
                success: true,
                data: roles,
            });
        } catch (error) {
            next(error);
        }
    }

    // 3️⃣ Get single role details
    async getRoleById(req, res, next) {
        try {
            const { id } = req.params;
            const companyId = req.user.companyId;

            const role = await prisma.role.findFirst({
                where: { id, companyId },
                include: {
                    rolePermissions: {
                        include: { permission: true },
                    },
                },
            });

            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: "Role not found",
                });
            }

            res.json({ success: true, data: role });
        } catch (error) {
            next(error);
        }
    }

    // 4️⃣ Update role info or permissions
    async updateRole(req, res, next) {
        try {
            const { id } = req.params;
            const { name, description, userLimit, permissionIds } = req.body;
            const companyId = req.user.companyId;

            const role = await prisma.role.findFirst({ where: { id, companyId } });
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: "Role not found",
                });
            }

            await prisma.role.update({
                where: { id },
                data: { name, description, userLimit },
            });

            if (permissionIds) {
                await prisma.rolePermission.deleteMany({ where: { roleId: id } });
                const newPerms = permissionIds.map((pid) => ({
                    roleId: id,
                    permissionId: pid,
                }));
                await prisma.rolePermission.createMany({
                    data: newPerms,
                    skipDuplicates: true,
                });
            }

            const updatedRole = await prisma.role.findUnique({
                where: { id },
                include: { rolePermissions: { include: { permission: true } } },
            });

            res.json({
                success: true,
                message: "Role updated successfully",
                data: updatedRole,
            });
        } catch (error) {
            console.error("Role Update Error:", error);
            next(error);
        }
    }

    // 5️⃣ Delete role
    async deleteRole(req, res, next) {
        try {
            const { id } = req.params;
            const companyId = req.user.companyId;

            const existing = await prisma.role.findFirst({
                where: { id, companyId },
            });
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: "Role not found",
                });
            }

            const userCount = await prisma.user.count({
                where: { roleId: id },
            });
            if (userCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot delete a role assigned to active users",
                });
            }

            await prisma.rolePermission.deleteMany({ where: { roleId: id } });
            await prisma.role.delete({ where: { id } });

            res.json({
                success: true,
                message: "Role deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    // 6️⃣ Assign permissions to a role (manual endpoint)
    async assignPermissions(req, res, next) {
        try {
            const { roleId, permissionIds } = req.body;
            const companyId = req.user.companyId;

            const role = await prisma.role.findFirst({
                where: { id: roleId, companyId },
            });
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: "Role not found",
                });
            }

            await prisma.rolePermission.deleteMany({ where: { roleId } });

            const rolePerms = permissionIds.map((pid) => ({
                roleId,
                permissionId: pid,
            }));
            await prisma.rolePermission.createMany({
                data: rolePerms,
                skipDuplicates: true,
            });

            res.json({
                success: true,
                message: "Permissions assigned successfully to role",
            });
        } catch (error) {
            next(error);
        }
    }

    // 7️⃣ List all permissions (helper)
    async getAllPermissions(req, res, next) {
        try {
            const permissions = await prisma.permission.findMany({
                orderBy: { module: "asc" },
            });

            res.json({
                success: true,
                data: permissions,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RoleController();
