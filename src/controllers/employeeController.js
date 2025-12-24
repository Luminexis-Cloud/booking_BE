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
        where: {
          companyId,
          id: {
            not: userId,
          },
        },
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
          password: hashedPassword,
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

  async adminUpdateEmployeeCredentials(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { companyId, newEmail, newPassword, adminCurrentPassword } =
        req.body;
      const adminUserId = req.user.userId;

      console.log("📥 Admin credential update request", {
        adminUserId,
        employeeId,
        companyId,
        updateEmail: !!newEmail,
        updatePassword: !!newPassword,
      });

      if (!adminCurrentPassword) {
        console.warn("⚠️ Missing adminCurrentPassword", { adminUserId });
        return res.status(400).json({
          success: false,
          message: "Admin current password is required.",
        });
      }

      if (!companyId) {
        console.warn("⚠️ Missing companyId", { adminUserId });
        return res.status(400).json({
          success: false,
          message: "companyId is required.",
        });
      }

      if (!newEmail && !newPassword) {
        console.warn("⚠️ No update fields provided", { adminUserId });
        return res.status(400).json({
          success: false,
          message: "New email or new password is required.",
        });
      }

      // 1️⃣ Verify admin
      const admin = await prisma.user.findFirst({
        where: {
          id: adminUserId,
          companyId,
          isActive: true,
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      if (!admin) {
        console.warn("🚫 Unauthorized admin access attempt", {
          adminUserId,
          companyId,
        });
        return res.status(403).json({
          success: false,
          message: "Unauthorized access.",
        });
      }

      // 2️⃣ Verify admin password
      const isAdminPasswordValid = await bcrypt.compare(
        adminCurrentPassword,
        admin.password
      );

      if (!isAdminPasswordValid) {
        console.warn("🚫 Invalid admin password attempt", {
          adminUserId,
          companyId,
        });
        return res.status(401).json({
          success: false,
          message: "Invalid admin password.",
        });
      }

      console.log("✅ Admin authenticated", {
        adminUserId,
        companyId,
      });

      // 3️⃣ Fetch employee
      const employee = await prisma.user.findFirst({
        where: {
          id: employeeId,
          companyId,
        },
      });

      if (!employee) {
        console.info("ℹ️ Employee not found", {
          employeeId,
          companyId,
        });
        return res.status(404).json({
          success: false,
          message: "Employee not found in this company.",
        });
      }

      const updateData = {};

      // 4️⃣ Email update
      if (newEmail) {
        const emailExists = await prisma.user.findUnique({
          where: { email: newEmail },
        });

        if (emailExists && emailExists.id === employeeId) {
          console.info("ℹ️ Email already in use", {
            newEmail,
            employeeId,
          });
          return res.status(409).json({
            success: false,
            message: "Email already in use.",
          });
        }

        updateData.email = newEmail;
        updateData.isVerified = false;
        updateData.isActive = false;
      }

      // 5️⃣ Password update
      if (newPassword) {
        if (newPassword.length < 8) {
          console.warn("⚠️ Weak password attempt", {
            adminUserId,
            employeeId,
          });
          return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters.",
          });
        }

        updateData.password = await bcrypt.hash(newPassword, 12);
      }

      // 6️⃣ Update employee
      await prisma.user.update({
        where: { id: employeeId },
        data: updateData,
      });

      console.log("✅ Employee credentials updated", {
        adminUserId,
        employeeId,
        companyId,
        updatedEmail: !!newEmail,
        updatedPassword: !!newPassword,
      });

      // 7️⃣ Invalidate employee sessions
      await prisma.refreshToken.deleteMany({
        where: { userId: employeeId },
      });

      console.log("🔐 Employee sessions invalidated", { employeeId });

      // 8️⃣ Send email
      if (newEmail) {
        await sendMail(
          newEmail,
          "Your account credentials were updated",
          `
          <p>Hello ${employee.firstName},</p>
          <p>Your account credentials have been updated by an administrator.</p>
          ${newPassword ? `<p><b>Temporary Password:</b> ${newPassword}</p>` : ""}
          <p>Please verify your email and change your password after login.</p>
        `
        );

        console.log("📧 Notification email sent", {
          employeeId,
          newEmail,
        });
      }

      return res.json({
        success: true,
        message: "Employee credentials updated successfully.",
      });
    } catch (error) {
      console.error("❌ adminUpdateEmployeeCredentials error", {
        message: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }
}

module.exports = new EmployeeController();
