const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();


class RoleController {
    // 1️⃣ Create a new role
    async createRole(req, res, next) {
    console.log("=== Create Role API Hit ===");

    try {
        console.log("Request Body:", req.body);
        console.log("Request Params:", req.params);
        console.log("Request Query:", req.query);
        console.log("User:", req.user);

        const { name, description, userLimit, permissionIds, visibleUserIds } = req.body;

        const companyId =
            req.params.companyId ||
            req.query.companyId ||
            req.user?.companyId;

        console.log("Resolved Company ID:", companyId);

        if (!companyId) {
            console.log("❌ Missing companyId");
            return res.status(400).json({
                success: false,
                message: "companyId is required."
            });
        }

        // Duplicate check
        console.log("🔍 Checking for duplicate role:", name);
        const existing = await prisma.role.findFirst({
            where: { name, companyId }
        });
        console.log("Duplicate Check Result:", existing);

        if (existing) {
            console.log("❌ Role already exists");
            return res.status(400).json({
                success: false,
                message: "Role already exists for this company"
            });
        }

        // Create role
        console.log("🛠 Creating role...");
        const role = await prisma.role.create({
            data: {
                name,
                description,
                userLimit: userLimit || 10,
                companyId
            }
        });
        console.log("✅ Role Created:", role);

        // Permissions
        if (permissionIds?.length > 0) {
            console.log("🔗 Creating role permissions:", permissionIds);
            await prisma.rolePermission.createMany({
                data: permissionIds.map(pid => ({
                    roleId: role.id,
                    permissionId: pid
                }))
            });
            console.log("✅ Permissions added");
        } else {
            console.log("ℹ No permissionIds provided");
        }

        // Visibility
        if (visibleUserIds?.length > 0) {
            console.log("👀 Creating visibility records:", visibleUserIds);
            await prisma.roleUserVisibility.createMany({
                data: visibleUserIds.map(uid => ({
                    roleId: role.id,
                    targetId: uid
                }))
            });
            console.log("✅ User visibility added");
        } else {
            console.log("ℹ No visibleUserIds provided");
        }

        console.log("🎉 Final Response Sent");
        return res.status(201).json({
            success: true,
            message: "Role created successfully",
            data: role
        });

    } catch (error) {
        console.error("💥 Role Create Error:", error);

        // Add deeper Prisma error debugging
        if (error.meta) console.error("Prisma Meta:", error.meta);
        if (error.code) console.error("Prisma Code:", error.code);

        next(error);
    }
}

    // 2️⃣ Get all roles
    async getAllRoles(req, res, next) {
        try {
            const companyId = req.user.companyId;

            const roles = await prisma.role.findMany({
                where: {companyId},
                include: {
                    rolePermissions: {include: {permission: true}},
                    visibilityRules: {
                        include: {
                            target: {
                                include: {store: true}
                            }
                        }
                    },
                    users: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });

            res.json({success: true, data: roles});

        } catch (error) {
            next(error);
        }
    }

    // 3️⃣ Get a single role
    async getRoleById(req, res, next) {
        try {
            const {id} = req.params;
            const companyId = req.user.companyId;

            const role = await prisma.role.findFirst({
                where: {id, companyId},
                include: {
                    rolePermissions: {include: {permission: true}},
                    visibilityRules: {
                        include: {
                            target: {include: {store: true}}
                        }
                    }
                }
            });

            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: "Role not found"
                });
            }

            res.json({success: true, data: role});

        } catch (error) {
            next(error);
        }
    }

    // 4️⃣ Update role + permissions + visibility
    async updateRole(req, res, next) {
        try {
            const {id} = req.params;
            const {name, description, userLimit, permissionIds, visibleUserIds} = req.body;
            const companyId = req.user.companyId;

            const role = await prisma.role.findFirst({where: {id, companyId}});
            if (!role) {
                return res.status(404).json({success: false, message: "Role not found"});
            }

            // Update role
            await prisma.role.update({
                where: {id},
                data: {name, description, userLimit}
            });

            // Update permissions
            if (permissionIds) {
                await prisma.rolePermission.deleteMany({where: {roleId: id}});
                await prisma.rolePermission.createMany({
                    data: permissionIds.map(pid => ({
                        roleId: id,
                        permissionId: pid
                    })),
                    skipDuplicates: true
                });
            }

            // Update visibility
            if (visibleUserIds) {
                await prisma.roleUserVisibility.deleteMany({where: {roleId: id}});

                await prisma.roleUserVisibility.createMany({
                    data: visibleUserIds.map(uid => ({
                        roleId: id,
                        targetId: uid
                    })),
                    skipDuplicates: true
                });
            }

            const updated = await prisma.role.findUnique({
                where: {id},
                include: {
                    rolePermissions: {include: {permission: true}},
                    visibilityRules: {include: {target: true}}
                }
            });

            res.json({
                success: true,
                message: "Role updated successfully",
                data: updated
            });

        } catch (error) {
            console.error("Role Update Error:", error);
            next(error);
        }
    }

    // 5️⃣ Delete role
    async deleteRole(req, res, next) {
        try {
            const {id} = req.params;
            const companyId = req.user.companyId;

            const existing = await prisma.role.findFirst({
                where: {id, companyId}
            });
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: "Role not found"
                });
            }

            const assignedUsers = await prisma.user.count({
                where: {roleId: id}
            });
            if (assignedUsers > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot delete a role assigned to users"
                });
            }

            await prisma.rolePermission.deleteMany({where: {roleId: id}});
            await prisma.roleUserVisibility.deleteMany({where: {roleId: id}});

            await prisma.role.delete({where: {id}});

            res.json({
                success: true,
                message: "Role deleted successfully"
            });

        } catch (error) {
            next(error);
        }
    }

    // 6️⃣ Assign Permissions Only
    async assignPermissions(req, res, next) {
        try {
            const {roleId, permissionIds} = req.body;
            const companyId = req.user.companyId;

            const role = await prisma.role.findFirst({
                where: {id: roleId, companyId}
            });
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: "Role not found"
                });
            }

            await prisma.rolePermission.deleteMany({where: {roleId}});

            await prisma.rolePermission.createMany({
                data: permissionIds.map(pid => ({
                    roleId,
                    permissionId: pid
                })),
                skipDuplicates: true
            });

            res.json({
                success: true,
                message: "Permissions updated"
            });

        } catch (error) {
            next(error);
        }
    }

    // 7️⃣ Assign / Update Role Visibility
    async updateRoleVisibility(req, res, next) {
        try {
            const {roleId, userIds} = req.body;
            const companyId = req.user.companyId;

            const role = await prisma.role.findFirst({where: {id: roleId, companyId}});
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: "Role not found"
                });
            }

            await prisma.roleUserVisibility.deleteMany({where: {roleId}});

            await prisma.roleUserVisibility.createMany({
                data: userIds.map(uid => ({
                    roleId,
                    targetId: uid
                })),
                skipDuplicates: true
            });

            res.json({
                success: true,
                message: "Role visibility updated successfully"
            });

        } catch (error) {
            next(error);
        }
    }

    // 8️⃣ Get all users available for assigning visibility
    async getAvailableUsers(req, res, next) {
        try {
            const companyId = req.user.companyId;

            const users = await prisma.user.findMany({
                where: {companyId},
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    storeId: true,
                    store: true
                }
            });

            res.json({success: true, data: users});

        } catch (error) {
            next(error);
        }
    }

    // 9️⃣ Get All Permissions (required for frontend role permission screen)
    async getAllPermissions(req, res, next) {
        try {
            const permissions = await prisma.permission.findMany({
                orderBy: { module: "asc" }
            });

            res.json({
                success: true,
                data: permissions
            });

        } catch (error) {
            console.error("Get All Permissions Error:", error);
            next(error);
        }
    }

}

module.exports = new RoleController();
