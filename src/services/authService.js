const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const config = require('../config/env');
const User = require('../models/User');

const prisma = new PrismaClient();

class AuthService {
  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId },
      config.JWT_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  async createUser(userData) {
    // Use custom User model for business logic
    return await User.createUser(userData);
  }

  async loginUser(email, password) {
    // Use custom User model for authentication
    const user = await User.authenticateUser(email, password);

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user.id);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken) {
    // Verify refresh token
    jwt.verify(refreshToken, config.JWT_SECRET);
    
    // Check if refresh token exists in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    if (!tokenRecord.user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: tokenRecord.userId },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    return { accessToken };
  }

  async logoutUser(refreshToken) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
  }

  async getUserById(userId) {
    // Use custom User model for getting user profile
    return await User.getUserProfile(userId);
  }
}

module.exports = new AuthService();
