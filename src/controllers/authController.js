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
    console.log("[completeCompanySetup] Request body:", req.body);

    const {
      userId,
      phone,
      companyName,
      nickname,
      country,
      industry,
      teamMembersCount,
    } = req.body;

    console.log("[completeCompanySetup] Looking up user:", userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.warn("[completeCompanySetup] User not found:", userId);
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    console.log("[completeCompanySetup] User found:", user.id);

    console.log("[completeCompanySetup] Creating company...");
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

    console.log("[completeCompanySetup] Company created:", company.id);

    console.log("[completeCompanySetup] Creating store...");
    const store = await prisma.store.create({
      data: {
        name: companyName,
        areaOfWork: industry,
        teamSize: teamMembersCount,
        date: new Date().toISOString(),
        signature: nickname,
        phoneNumber: phone,

        manager: {
          connect: { id: userId },
        },

        company: {
          connect: { id: company.id },
        },
      },
    });

    console.log("[completeCompanySetup] Store created:", store.id);

    console.log("[completeCompanySetup] Fetching SuperAdmin role...");
    const role = await prisma.role.findUnique({
      where: { name: "SuperAdmin" },
    });

    if (!role) {
      console.error("[completeCompanySetup] SuperAdmin role not found");
      throw new Error("SuperAdmin role not found");
    }

    console.log("[completeCompanySetup] SuperAdmin role found:", role.id);

    console.log("[completeCompanySetup] Updating user...");
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        phoneNumber: phone,
        companyId: company.id,
        roleId: role.id,
        isVerified: true,
        storeId: store.id,
      },
      include: { role: true, company: true },
    });

    console.log("[completeCompanySetup] User updated:", updatedUser.id);

    console.log("[completeCompanySetup] Generating tokens...");
    const { accessToken, refreshToken } =
      authService.generateTokens(userId);

    console.log("[completeCompanySetup] Deleting old refresh tokens...");
    await prisma.refreshToken.deleteMany({ where: { userId } });

    console.log("[completeCompanySetup] Saving new refresh token...");
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
    });

    console.log("[completeCompanySetup] Setup completed successfully");

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
    console.error("[completeCompanySetup] ERROR:", err);
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
  console.log("📥 LOGIN REQUEST BODY:", req.body);

  const { email, password } = req.body;

  // Fetch user with relations
  console.log("🔍 Searching user by email:", email);
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

  console.log("🔎 USER FOUND:", user ? user.id : "❌ No user found");

  if (!user) {
    console.log("❌ Invalid credentials - user not found");
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  const isAdmin = user.userType === "ADMIN" || user.userType === "SUPER_ADMIN";
  const isFirstTimeLogin =
    !isAdmin && user.isVerified === false && user.isActive === false;

  // 🆕 Activate & verify on first login
  let updatedUser = user;

  if (isFirstTimeLogin) {
    console.log("🆕 First-time login → activating user:", user.id);

    updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        isVerified: true,
      },
    });
  }

  if (!user.isActive && !isFirstTimeLogin) {
    console.log("🚫 User account deactivated:", user.id);
    return res
      .status(401)
      .json({ success: false, message: "Account deactivated" });
  }

  console.log("🔐 Comparing password...");
  const valid = await bcrypt.compare(password, user.password);

  console.log("🔐 Password valid?", valid);

  if (!valid) {
    console.log("❌ Invalid password for:", email);
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  console.log("⚡ Generating tokens...");
  const { accessToken, refreshToken } = authService.generateTokens(user.id);
  console.log("🔑 Tokens generated:", { accessToken, refreshToken });

  // Remove old refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  console.log("🗑️ Old refresh tokens removed");

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 86400000),
    },
  });

  console.log("💾 New refresh token stored");

  console.log("👀 Fetching role visibility for role:", user.roleId);
  const roleVisibility = await prisma.roleUserVisibility.findMany({
    where: { roleId: user.roleId },
    include: {
      target: { include: { store: true, company: true } },
    },
  });

  console.log("👁 Visibility count:", roleVisibility.length);

  const visibilityUsers = roleVisibility.map((v) => ({
    id: v.target.id,
    firstName: v.target.firstName,
    lastName: v.target.lastName,
    email: v.target.email,
    phoneNumber: v.target.phoneNumber,
    companyId: v.target.companyId,
    storeId: v.target.storeId,
    store:[v.target.store],
  }));

  console.log("👁 Visibility Users:", visibilityUsers.length);

  const permissions = user.role.rolePermissions.map((p) => ({
    id: p.permission.id,
    name: p.permission.name,
    module: p.permission.module,
    action: p.permission.action,
  }));

  console.log("🔐 Permissions mapped:", permissions.length);

  console.log("✅ Login successful for:", user.email);
  
  const cleanUser = {
    ...user,
    store: user.store ? [{
        storeId: user.store.id,
        ...user.store,
      }]
    : [],
  };

  return res.json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        ...cleanUser,
        permissions,
        visibility: visibilityUsers,
      },
      accessToken,
      refreshToken,
    },
  });

} catch (err) {
  console.error("🔥 LOGIN ERROR:", err);
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

  async updatePassword(req, res, next) {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    next(err);
  }
}

}

module.exports = new AuthController();
