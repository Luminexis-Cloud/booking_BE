const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { generateRandomPassword } = require("../utils/generatePassword");
const { sendMail } = require("../utils/emailService");

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
      const storeId = req.query.storeId || req.body.storeId;
      const userId = req.user.userId;

      console.log(userId);

      if (!storeId)
        return res.status(400).json({
          success: false,
          message: "storeId is required.",
        });

      const employees = await prisma.user.findMany({
        where: {
          storeId,
          id: {
            not: userId,
          },
        },
        //include: { role: true, store: true },
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
      // await prisma.refreshToken.deleteMany({
      //   where: { userId: employeeId },
      // });

      // console.log("🔐 Employee sessions invalidated", { employeeId });

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

  // ==========================
  // ADD MULTIPLE SERVICES
  // ==========================
  async addMultipleEmployeeServices(req, res, next) {
    try {
      const { employeeId, storeId, serviceIds } = req.body;

      console.log("📥 REQUEST BODY:", req.body);

      // 1️⃣ Validate input
      if (
        !employeeId ||
        !storeId ||
        !Array.isArray(serviceIds) ||
        serviceIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "employeeId, storeId and serviceIds[] are required.",
        });
      }

      // 2️⃣ Validate employee
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { id: true },
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found.",
        });
      }

      // 3️⃣ 🔥 VALIDATE SERVICES (THIS PREVENTS FK ERROR)
      const services = await prisma.service.findMany({
        where: {
          id: { in: serviceIds },
          storeId, // 🔥 VERY IMPORTANT
          isActive: true, // 🔥 recommended
        },
        select: { id: true },
      });

      const validServiceIds = services.map((s) => s.id);
      const invalidServiceIds = serviceIds.filter(
        (id) => !validServiceIds.includes(id)
      );

      // 4️⃣ If any invalid → STOP
      if (invalidServiceIds.length > 0) {
        console.warn("🚫 Invalid serviceIds detected:", invalidServiceIds);

        return res.status(400).json({
          success: false,
          message:
            "Some serviceIds are invalid or do not belong to this store.",
          invalidServiceIds,
        });
      }

      // 5️⃣ Prepare rows
      const rows = validServiceIds.map((serviceId) => ({
        employeeId,
        serviceId,
        storeId,
      }));

      console.log("ROWS TO INSERT:", rows);

      // 6️⃣ Insert safely
      const result = await prisma.employeeService.createMany({
        data: rows,
        skipDuplicates: true,
      });

      return res.status(201).json({
        success: true,
        message:
          result.count > 0
            ? "Employee services added successfully."
            : "No new services were added (duplicates skipped).",
        insertedCount: result.count,
      });
    } catch (error) {
      console.error("❌ ERROR IN addMultipleEmployeeServices:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      return res.status(500).json({
        success: false,
        message: "Failed to add employee services.",
      });
    }
  }

  // ==========================
  // GET SERVICES BY EMPLOYEE
  // ==========================
  async getServicesByEmployee(req, res, next) {
    try {
      const { employeeId } = req.params;

      const services = await prisma.employeeService.findMany({
        where: { employeeId },
        include: {
          service: true,
          store: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json({
        success: true,
        count: services.length,
        data: services,
      });
    } catch (error) {
      next(error);
    }
  }

  // 🔹 POST – Save schedule
  async saveSchedule(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { pattern, weeklySchedule } = req.body;

      // 🔴 Basic validations
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "employeeId is required",
        });
      }

      if (!pattern || !Number.isInteger(pattern.repeatEveryWeeks)) {
        return res.status(400).json({
          success: false,
          message: "pattern.repeatEveryWeeks must be a valid number",
        });
      }

      if (pattern.repeatEveryWeeks < 1) {
        return res.status(400).json({
          success: false,
          message: "repeatEveryWeeks must be greater than or equal to 1",
        });
      }

      if (!Array.isArray(weeklySchedule)) {
        return res.status(400).json({
          success: false,
          message: "weeklySchedule must be an array",
        });
      }

      // 🔴 Ensure employee exists
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      // 1️⃣ Replace existing pattern
      await prisma.employeeSchedulePattern.deleteMany({
        where: { userId: employeeId },
      });

      await prisma.employeeSchedulePattern.create({
        data: {
          userId: employeeId,
          repeatEveryWeeks: pattern.repeatEveryWeeks,
          startsAt: pattern.startsAt ? new Date(pattern.startsAt) : null,
        },
      });

      // 2️⃣ Save weekly schedules
      for (const day of weeklySchedule) {
        const { dayOfWeek, isEnabled, timeSlots } = day;

        if (typeof dayOfWeek !== "number" || dayOfWeek < 1 || dayOfWeek > 7) {
          return res.status(400).json({
            success: false,
            message: "dayOfWeek must be between 1 and 7",
          });
        }

        const schedule = await prisma.employeeWorkingSchedule.upsert({
          where: {
            userId_dayOfWeek: {
              userId: employeeId,
              dayOfWeek,
            },
          },
          update: { isEnabled: !!isEnabled },
          create: {
            userId: employeeId,
            dayOfWeek,
            isEnabled: !!isEnabled,
          },
        });

        // Replace time slots
        await prisma.employeeTimeSlot.deleteMany({
          where: { scheduleId: schedule.id },
        });

        if (isEnabled && Array.isArray(timeSlots)) {
          for (const slot of timeSlots) {
            if (!slot.startTime || !slot.endTime) {
              return res.status(400).json({
                success: false,
                message: "Each timeSlot must have startTime and endTime",
              });
            }
          }

          if (timeSlots.length) {
            await prisma.employeeTimeSlot.createMany({
              data: timeSlots.map((slot) => ({
                scheduleId: schedule.id,
                startTime: slot.startTime,
                endTime: slot.endTime,
              })),
            });
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: "Employee schedule saved successfully",
      });
    } catch (error) {
      console.error("❌ saveSchedule error:", error);
      next(error);
    }
  }

  // 🔹 GET – Fetch schedule
  async getSchedule(req, res, next) {
    try {
      const { employeeId } = req.params;

      // 🔴 Validate employeeId
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "employeeId is required",
        });
      }

      // 🔴 Ensure employee exists
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      // 1️⃣ Get schedule pattern (number-based)
      const pattern = await prisma.employeeSchedulePattern.findFirst({
        where: { userId: employeeId, isActive: true },
        select: {
          repeatEveryWeeks: true,
          startsAt: true,
        },
      });

      // 2️⃣ Get weekly schedules
      const schedules = await prisma.employeeWorkingSchedule.findMany({
        where: { userId: employeeId },
        include: { timeSlots: true },
        orderBy: { dayOfWeek: "asc" },
      });

      return res.status(200).json({
        success: true,
        data: {
          employeeId,
          pattern: pattern
            ? {
                repeatEveryWeeks: pattern.repeatEveryWeeks,
                startsAt: pattern.startsAt,
              }
            : null,
          weeklySchedule: schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            isEnabled: s.isEnabled,
            timeSlots: s.timeSlots.map((t) => ({
              startTime: t.startTime,
              endTime: t.endTime,
            })),
          })),
        },
      });
    } catch (error) {
      console.error("❌ getSchedule error:", error);
      next(error);
    }
  }
}

module.exports = new EmployeeController();
