const authService = require("../services/authService");
const MessageServiceFactory = require("../services/messageServiceFactory");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class AuthController {
  // Send OTP for signup
  async sendSignupOtp(req, res, next) {
    try {
      const { phoneNumber } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this phone number",
        });
      }

      // Get message service based on environment
      const messageService = MessageServiceFactory.create();

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Send OTP
      await messageService.sendOtp(phoneNumber, otp);

      // Store OTP in database
      await prisma.otpCode.create({
        data: {
          code: otp,
          phoneNumber,
          type: "signup",
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        },
      });

      res.json({
        success: true,
        message: "Verification code sent successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify OTP (phone verification complete)
  async verifySignupOtp(req, res, next) {
    try {
      const { phoneNumber, otp } = req.body;

      // Verify OTP
      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          phoneNumber,
          code: otp,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification code",
        });
      }

      // Mark OTP as used
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });

      res.json({
        success: true,
        message: "Phone number verified successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Login with email + password
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      if (!user.isVerified) {
        return res.status(401).json({
          success: false,
          message: "Account not verified. Please complete signup first.",
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Generate JWT tokens
      const { accessToken, refreshToken } = authService.generateTokens(user.id);

      // Delete existing refresh tokens for this user
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      // Store new refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            isActive: user.isActive,
            isVerified: user.isVerified,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Signup (final step, uses form payload)
  async signup(req, res, next) {
    try {
      const { firstName, lastName, email, password, phone } = req.body;

      // Check if user already exists with email
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      // Check if user already exists with phone (only if phone is provided)
      const phoneNumber = phone && phone.trim() ? phone.trim() : null;
      if (phoneNumber) {
        const existingUserByPhone = await prisma.user.findUnique({
          where: { phoneNumber: phoneNumber },
        });

        if (existingUserByPhone) {
          return res.status(400).json({
            success: false,
            message: "User already exists with this phone number",
          });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Prepare user data - only include phoneNumber if provided
      const userData = {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        isVerified: true,
      };

      // Only add phoneNumber if it's provided
      if (phoneNumber) {
        userData.phoneNumber = phoneNumber;
      }

      // Create user
      const user = await prisma.user.create({
        data: userData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
        },
      });

      // Generate JWT tokens
      const { accessToken, refreshToken } = authService.generateTokens(user.id);

      // Delete existing refresh tokens for this user
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      // Store new refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // async login(req, res, next) {
  //   try {
  //     const { email, password } = req.body;

  //     const result = await authService.loginUser(email, password);

  //     res.status(200).json({
  //       success: true,
  //       message: 'Login successful',
  //       data: result,
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  // async refreshToken(req, res, next) {
  //   try {
  //     const { refreshToken } = req.body;

  //     if (!refreshToken) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Refresh token is required',
  //       });
  //     }

  //     const result = await authService.refreshAccessToken(refreshToken);

  //     res.status(200).json({
  //       success: true,
  //       message: 'Token refreshed successfully',
  //       data: result,
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  // async logout(req, res, next) {
  //   try {
  //     const { refreshToken } = req.body;

  //     await authService.logoutUser(refreshToken);

  //     res.status(200).json({
  //       success: true,
  //       message: 'Logout successful',
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  // Send OTP for forgot password
  async sendForgotPasswordOtp(req, res, next) {
    try {
      const { email } = req.body;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if user exists for security
        return res.json({
          success: true,
          message: "If an account exists with this email, a verification code has been sent",
        });
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // For now, log OTP (in production, send via email service)
      console.log(`FORGOT PASSWORD OTP for ${email}: ${otp}`);

      // Store OTP in database
      await prisma.otpCode.create({
        data: {
          code: otp,
          email,
          type: "forgot-password",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      });

      res.json({
        success: true,
        message: "Verification code sent to your email",
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify OTP for forgot password
  async verifyForgotPasswordOtp(req, res, next) {
    try {
      const { email, otp } = req.body;

      // Verify OTP
      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          email,
          code: otp,
          type: "forgot-password",
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification code",
        });
      }

      // Mark OTP as used
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });

      res.json({
        success: true,
        message: "Code verified successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset password after OTP verification
  async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;

      // Verify OTP was used (additional security check)
      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          email,
          code: otp,
          type: "forgot-password",
          isUsed: true,
          expiresAt: { gt: new Date(Date.now() - 30 * 60 * 1000) }, // Used within last 30 minutes
        },
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification. Please request a new code.",
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Delete all OTP codes for this email
      await prisma.otpCode.deleteMany({
        where: {
          email,
          type: "forgot-password",
        },
      });

      res.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // async getProfile(req, res, next) {
  //   try {
  //     const userId = req.user.userId;
  //     const user = await authService.getUserById(userId);

  //     res.status(200).json({
  //       success: true,
  //       message: 'Profile retrieved successfully',
  //       data: { user },
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // }
}

module.exports = new AuthController();