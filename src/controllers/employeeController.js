const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { generateRandomPassword } = require("../utils/generatePassword");
const { sendMail } = require("../utils/emailService");

const prisma = new PrismaClient();

class EmployeeController {
    // 1️⃣ CREATE EMPLOYEE (enforces company & role limits)
    async createEmployee(req, res, next) {
        try {
            const { firstName, lastName, email, phoneNumber, roleId, storeId } = req.body;
            const creator = req.user;

            // Ensure creator belongs to a company
            if (!creator.companyId)
                return res.status(400).json({ success: false, message: "Creator must belong to a company." });

            const [role, company] = await Promise.all([
                prisma.role.findUnique({ where: { id: roleId } }),
                prisma.company.findUnique({
                    where: { id: creator.companyId },
                    include: { users: true },
                }),
            ]);

            if (!role)
                return res.status(400).json({ success: false, message: "Invalid role selected." });
            if (!company)
                return res.status(404).json({ success: false, message: "Company not found." });

            // 🧩 Check COMPANY-level user limit (by company.id)
            const companyUserCount = await prisma.user.count({
                where: { companyId: company.id },
            });
            if (companyUserCount >= company.userLimit) {
                return res.status(400).json({
                    success: false,
                    message: `Company limit reached (${company.userLimit}). Please upgrade your plan.`,
                });
            }

            // 🧩 Check ROLE-level limit (optional)
            const roleUserCount = await prisma.user.count({
                where: { companyId: company.id, roleId },
            });
            if (role.userLimit && roleUserCount >= role.userLimit) {
                return res.status(400).json({
                    success: false,
                    message: `Role limit reached. Only ${role.userLimit} ${role.name}s allowed.`,
                });
            }

            // 🧩 Check duplicates
            const existing = await prisma.user.findFirst({
                where: { OR: [{ email }, { phoneNumber }] },
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: "Employee already exists with this email or phone number.",
                });
            }

            // 🔐 Generate password
            const tempPassword = generateRandomPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 12);

            // 🧠 Create employee
            const employee = await prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    phoneNumber,
                    password: hashedPassword,
                    companyId: company.id, // ✅ always associate with creator’s company
                    storeId,
                    roleId,
                    isVerified: false,
                },
                include: { role: true },
            });

            // ✉️ Send credentials email
            await sendMail(
                email,
                `Welcome to ${company.name}`,
                `
          <h3>Welcome to ${company.name}!</h3>
          <p>Your account has been created as <b>${employee.role.name}</b>.</p>
          <p>Login Email: ${email}<br>Password: ${tempPassword}</p>
          <p>Please change your password after first login.</p>
        `
            );

            res.status(201).json({
                success: true,
                message: "Employee created successfully and credentials emailed.",
                data: { employee },
            });
        } catch (error) {
            console.error("❌ createEmployee error:", error);
            next(error);
        }
    }

    // 2️⃣ LIST EMPLOYEES (company-scoped)
    async listEmployees(req, res, next) {
        try {
            const user = req.user;

            // Show only users from same company
            const employees = await prisma.user.findMany({
                where: { companyId: user.companyId },
                include: { role: true, store: true },
                orderBy: { createdAt: "desc" },
            });

            res.json({ success: true, employees });
        } catch (error) {
            next(error);
        }
    }

    // 3️⃣ GET SINGLE EMPLOYEE
    async getEmployeeById(req, res, next) {
        try {
            const { id } = req.params;
            const user = req.user;

            const employee = await prisma.user.findFirst({
                where: { id, companyId: user.companyId },
                include: { role: true, store: true },
            });

            if (!employee)
                return res.status(404).json({ success: false, message: "Employee not found in your company" });

            res.json({ success: true, employee });
        } catch (error) {
            next(error);
        }
    }

    // 4️⃣ UPDATE EMPLOYEE
    async updateEmployee(req, res, next) {
        try {
            const { id } = req.params;
            const { firstName, lastName, phoneNumber, roleId, storeId, isActive } = req.body;
            const user = req.user;

            const employee = await prisma.user.updateMany({
                where: { id, companyId: user.companyId },
                data: { firstName, lastName, phoneNumber, roleId, storeId, isActive },
            });

            if (!employee.count)
                return res.status(404).json({ success: false, message: "Employee not found or not in your company" });

            const updated = await prisma.user.findUnique({
                where: { id },
                include: { role: true, store: true },
            });

            res.json({ success: true, message: "Employee updated successfully", data: { updated } });
        } catch (error) {
            next(error);
        }
    }

    // 5️⃣ TOGGLE ACTIVE STATUS
    async toggleEmployeeStatus(req, res, next) {
        try {
            const { id } = req.params;
            const user = req.user;

            const employee = await prisma.user.findFirst({
                where: { id, companyId: user.companyId },
            });
            if (!employee)
                return res.status(404).json({ success: false, message: "Employee not found" });

            const updated = await prisma.user.update({
                where: { id },
                data: { isActive: !employee.isActive },
            });

            res.json({
                success: true,
                message: `Employee ${updated.isActive ? "activated" : "deactivated"} successfully.`,
            });
        } catch (error) {
            next(error);
        }
    }

    // 6️⃣ DELETE EMPLOYEE
    async deleteEmployee(req, res, next) {
        try {
            const { id } = req.params;
            const user = req.user;

            await prisma.user.deleteMany({ where: { id, companyId: user.companyId } });

            res.json({ success: true, message: "Employee deleted successfully" });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new EmployeeController();
