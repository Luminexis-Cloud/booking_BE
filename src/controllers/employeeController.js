const {PrismaClient} = require("@prisma/client");
const bcrypt = require("bcryptjs");
const {generateRandomPassword} = require("../utils/generatePassword");
const {sendMail} = require("../utils/emailService");

const prisma = new PrismaClient();

class EmployeeController {
  // 1️⃣ CREATE EMPLOYEE (companyId now comes from body)
  async createEmployee(req, res, next) {
    try {
      const {
        firstName,
        email,
        phoneNumber,
        roleId,
        storeId,
        companyId, // 👈 NOW COMING FROM REQUEST BODY
      } = req.body;

      if (!companyId)
        return res.status(400).json({
          success: false,
          message: "companyId is required.",
        });

      // Fetch role and company
      const [role, company] = await Promise.all([
        prisma.role.findUnique({ where: { id: roleId } }),
        prisma.company.findUnique({
          where: { id: companyId },
          include: { users: true },
        }),
      ]);

      if (!role)
        return res
          .status(400)
          .json({ success: false, message: "Invalid role selected." });

      if (!company)
        return res
          .status(404)
          .json({ success: false, message: "Company not found." });

      // 🧩 Company User Limit Check
      const companyUserCount = await prisma.user.count({
        where: { companyId },
      });

      if (companyUserCount >= company.userLimit) {
        return res.status(400).json({
          success: false,
          message: `Company user limit reached (${company.userLimit}). Upgrade your plan.`,
        });
      }

      // 🧩 Role Limit Check
      const roleUserCount = await prisma.user.count({
        where: { companyId, roleId },
      });

      if (role.userLimit && roleUserCount >= role.userLimit) {
        return res.status(400).json({
          success: false,
          message: `Role limit reached. Only ${role.userLimit} ${role.name}s allowed.`,
        });
      }

      // 🧩 Duplicate check
      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { phoneNumber }] },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Employee already exists with this email or phone number.",
        });
      }

      // Password
      const tempPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      // Create employee
      const employee = await prisma.user.create({
        data: {
          firstName,
          email,
          phoneNumber,
          password: hashedPassword,
          companyId,
          storeId,
          roleId,
          isActive: false,
          isVerified: false,
        },
        include: { role: true },
      });

      // Send email
      //   await sendMail(
      //     email,
      //     `Welcome to ${company.name}`,
      //     `
      //             <h3>Welcome to ${company.name}!</h3>
      //             <p>Your account has been created as <b>${employee.role.name}</b>.</p>
      //             <p>Email: ${email} <br> Temporary Password: ${tempPassword}</p>
      //             <p>Please change your password at first login.</p>
      //             `
      //   );

      res.status(201).json({
        success: true,
        message: "Employee created successfully.",
        data: { employee },
      });
    } catch (error) {
      console.error("❌ createEmployee error:", error);
      next(error);
    }
  }

  // 2️⃣ LIST EMPLOYEES (companyId comes from query or body)
  async listEmployees(req, res, next) {
    try {
      const companyId = req.query.companyId || req.body.companyId;
      const userId = req.user.userId;

      console.log(userId);
      
      if (!companyId)
        return res.status(400).json({
          success: false,
          message: "companyId is required.",
        });

      const employees = await prisma.user.findMany({
        where: { companyId },
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
      const companyId = req.query.companyId || req.body.companyId;

      if (!companyId)
        return res
          .status(400)
          .json({ success: false, message: "companyId is required." });

      const employee = await prisma.user.findFirst({
        where: { id, companyId },
        include: { role: true, store: true },
      });

      if (!employee)
        return res.status(404).json({
          success: false,
          message: "Employee not found in this company",
        });

      res.json({ success: true, employee });
    } catch (error) {
      next(error);
    }
  }

  // 4️⃣ UPDATE EMPLOYEE
  async updateEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const companyId = req.body.companyId;

      if (!companyId)
        return res
          .status(400)
          .json({ success: false, message: "companyId is required." });

      const updatedCount = await prisma.user.updateMany({
        where: { id, companyId },
        data: req.body,
      });

      if (!updatedCount.count)
        return res.status(404).json({
          success: false,
          message: "Employee not found or not in this company.",
        });

      const updated = await prisma.user.findUnique({
        where: { id },
        include: { role: true, store: true },
      });

      res.json({
        success: true,
        message: "Employee updated successfully",
        data: { updated },
      });
    } catch (error) {
      next(error);
    }
  }

  // 5️⃣ TOGGLE ACTIVE STATUS
  async toggleEmployeeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const companyId = req.body.companyId;

      if (!companyId)
        return res
          .status(400)
          .json({ success: false, message: "companyId is required." });

      const employee = await prisma.user.findFirst({
        where: { id, companyId },
      });

      if (!employee)
        return res.status(404).json({
          success: false,
          message: "Employee not found in this company",
        });

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
      const companyId = req.body.companyId;

      if (!companyId)
        return res
          .status(400)
          .json({ success: false, message: "companyId is required." });

      await prisma.user.deleteMany({
        where: { id, companyId },
      });

      res.json({ success: true, message: "Employee deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  async sendEmployeeInvitation(req, res, next) {
    try {
      const { employeeId, companyId } = req.params;

      if (!employeeId || !companyId) {
        return res.status(400).json({
          success: false,
          message: "employeeId and companyId are required.",
        });
      }

      // 🔍 Fetch employee (ensure belongs to company)
      const employee = await prisma.user.findFirst({
        where: {
          id: employeeId,
          companyId,
        },
        include: {
          role: true,
          company: true,
        },
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found for this company.",
        });
      }

      if (!employee.email) {
        return res.status(400).json({
          success: false,
          message: "Employee email not found.",
        });
      }

      // 🔐 Generate & update temporary password
      const tempPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await prisma.user.update({
        where: { id: employee.id }, // ✅ FIXED
        data: {
          password: hashedPassword
        },
      });

      // ✉️ Send email
      const mailInfo = await sendMail(
        employee.email,
        `Welcome to ${employee.firstName}`, // ✅ FIXED
        `
        <h3>Welcome to ${employee.firstName}!</h3>
        <p>Your account has been created as <b>${employee.role.name}</b>.</p>
        <p>Email: ${employee.email} <br> Temporary Password: ${tempPassword}</p>
        <p>Please change your password at first login.</p>
      `
      );

      // ✅ OPTIONAL: check mail status
      if (mailInfo?.rejected?.length) {
        return res.status(500).json({
          success: false,
          message: "Email rejected by mail server.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Invitation email sent successfully.",
      });
    } catch (error) {
      console.error("❌ sendEmployeeInvitation error:", error);
      next(error);
    }
  }
}

module.exports = new EmployeeController();
