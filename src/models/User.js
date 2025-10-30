// Custom User Model - Business Logic Layer
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class User {
  // Business validation rules
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    return true;
  }

  static validateUsername(username) {
    if (username.length < 3 || username.length > 30) {
      throw new Error('Username must be between 3-30 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }
    return true;
  }

  static validatePassword(password) {
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    // Add more password rules as needed
    return true;
  }

  static validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) return true; // Optional field
    
    // Basic phone number validation (adjust regex as needed)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }
    return true;
  }

  // Business logic for user creation
  static async createUser(userData) {
    const { firstName, lastName, email, phoneNumber, password } = userData;

    // Validate using business rules
    this.validateEmail(email);
    this.validatePhoneNumber(phoneNumber);
    this.validatePassword(password);

    // Check if user exists with email (business rule)
    const existingUserByEmail = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new Error('User with this email already exists');
    }

    // Check if user exists with phone (business rule)
    const existingUserByPhone = await prisma.user.findFirst({
      where: { phoneNumber },
    });

    if (existingUserByPhone) {
      throw new Error('User with this phone number already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        password: hashedPassword,
        isVerified: true,
      },
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

    return user;
  }

  // Business logic for user login
  static async authenticateUser(email, password) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }

  // Business logic for user profile
  static async getUserProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Business logic for updating user
  static async updateUser(userId, updateData) {
    // Validate update data
    if (updateData.email) {
      this.validateEmail(updateData.email);
    }
    if (updateData.phoneNumber) {
      this.validatePhoneNumber(updateData.phoneNumber);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    return user;
  }
}

module.exports = User;
