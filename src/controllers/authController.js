const authService = require("../services/authService");
const MessageServiceFactory = require("../services/messageServiceFactory");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { sendMail } = require("../utils/emailService");

const prisma = new PrismaClient();

class AuthController {
  async checkEmail(req, res, next) {
    try {
      const { email } = req.body;

      if (!email)
        return res
          .status(400)
          .json({ success: false, message: "Email is required" });

      const user = await prisma.user.findUnique({ where: { email } });

      if (user)
        return res
          .status(400)
          .json({ success: false, message: "Email already exists" });

      return res.json({ success: true, message: "Email available" });
    } catch (err) {
      next(err);
    }
  }

  async createAccountBasic(req, res, next) {
    try {
      const { name, email, password, confirmPassword } = req.body;

      if (!email || !name)
        return res
          .status(400)
          .json({ success: false, message: "Name and email are required" });

      if (password !== confirmPassword)
        return res
          .status(400)
          .json({ success: false, message: "Passwords do not match" });

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing)
        return res
          .status(400)
          .json({ success: false, message: "Email already exists" });

      // split name into first + last
      const [firstName, ...rest] = name.trim().split(" ");
      const lastName = rest.length > 0 ? rest.join(" ") : "";

      const hashed = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashed,
          phoneNumber: "TEMP_" + Date.now(), // placeholder phone
          isVerified: false,
        },
      });

      return res.json({
        success: true,
        message: "Basic account created",
        data: { userId: user.id },
      });
    } catch (err) {
      next(err);
    }
  }

  async completeCompanySetup(req, res, next) {
    try {
      const {
        userId,
        phone,
        companyName,
        nickname,
        country,
        industry,
        teamMembersCount,
      } = req.body;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      // Create company with new fields
      const company = await prisma.company.create({
        data: {
          name: companyName,
          signatureName: nickname || null,
          country: country || null,
          industry: industry || null,
          teamMembersCount: teamMembersCount || null,
          domain: nickname || null,
          userLimit: 100,
        },
      });

      // SuperAdmin role
      const role = await prisma.role.findUnique({
        where: { name: "SuperAdmin" },
      });

      // Update user with real phone + companyId + role
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          phoneNumber: phone,
          companyId: company.id,
          roleId: role.id,
          isVerified: true,
        },
        include: { role: true, company: true },
      });

      // Generate tokens
      const { accessToken, refreshToken } = authService.generateTokens(userId);

      await prisma.refreshToken.deleteMany({ where: { userId } });
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId,
          expiresAt: new Date(Date.now() + 30 * 86400000),
        },
      });

      return res.json({
        success: true,
        message: "Company setup completed",
        data: {
          user: updatedUser,
          company,
          accessToken,
          refreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async sendSignupOtp(req, res, next) {
    try {
      const { email } = req.body;

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Send OTP via email
      await sendMail(
        email,
        "Your OTP Code",
        `
                <h3>Your Verification Code</h3>
                <p>Your OTP code is: <b>${otp}</b></p>
                <p>This code will expire in 5 minutes.</p>
            `
      );

      // Save OTP to DB
      await prisma.otpCode.create({
        data: {
          code: otp,
          email,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      return res.json({ success: true, message: "OTP sent to email" });
    } catch (err) {
      next(err);
    }
  }

  async verifySignupOtp(req, res, next) {
    try {
      const { email, otp } = req.body;

      const record = await prisma.otpCode.findFirst({
        where: {
          email,
          code: otp,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!record) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      await prisma.otpCode.update({
        where: { id: record.id },
        data: { isUsed: true },
      });

      return res.json({ success: true, message: "OTP verified" });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
          company: true,
          store: true,
        },
      });

      if (!user)
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });

      if (!user.isActive)
        return res
          .status(401)
          .json({ success: false, message: "Account deactivated" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid)
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });

      const { accessToken, refreshToken } = authService.generateTokens(user.id);

      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 86400000),
        },
      });

      const roleVisibility = await prisma.roleUserVisibility.findMany({
        where: { roleId: user.roleId },
        include: {
          target: { include: { store: true, company: true } },
        },
      });

      const visibilityUsers = roleVisibility.map((v) => ({
        id: v.target.id,
        firstName: v.target.firstName,
        lastName: v.target.lastName,
        email: v.target.email,
        phoneNumber: v.target.phoneNumber,
        companyId: v.target.companyId,
        storeId: v.target.storeId,
        store: v.target.store,
      }));

      const permissions = user.role.rolePermissions.map((p) => ({
        id: p.permission.id,
        name: p.permission.name,
        module: p.permission.module,
        action: p.permission.action,
      }));

      return res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            ...user,
            permissions,
            visibility: visibilityUsers,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async signup(req, res, next) {
    try {
      const {
        name,
        email,
        password,
        phone,
        companyName,
        nickname,
        country,
        industry,
        teamMembersCount,
      } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing)
        return res
          .status(400)
          .json({ success: false, message: "User already exists" });

      // split name
      const [firstName, ...rest] = name.split(" ");
      const lastName = rest.join(" ");

      const company = await prisma.company.create({
        data: {
          name: companyName,
          signatureName: nickname,
          country,
          industry,
          teamMembersCount,
          domain: nickname,
          userLimit: 100,
        },
      });

      const role = await prisma.role.findUnique({
        where: { name: "SuperAdmin" },
      });

      const hashed = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          phoneNumber: phone,
          password: hashed,
          isVerified: true,
          roleId: role.id,
          companyId: company.id,
        },
        include: { role: true, company: true },
      });

      const { accessToken, refreshToken } = authService.generateTokens(user.id);

      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 86400000),
        },
      });

      return res.status(201).json({
        success: true,
        message: "Signup completed",
        data: { user, company, accessToken, refreshToken },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
