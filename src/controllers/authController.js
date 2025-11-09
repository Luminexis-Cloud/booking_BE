const authService = require("../services/authService");
const MessageServiceFactory = require("../services/messageServiceFactory");
const bcrypt = require("bcryptjs");
const {PrismaClient} = require("@prisma/client");

const prisma = new PrismaClient();

class AuthController {
    // ----------------------------
    // 1️⃣ Send OTP for signup
    // ----------------------------
    async sendSignupOtp(req, res, next) {
        try {
            const {phoneNumber} = req.body;

            const existingUser = await prisma.user.findUnique({
                where: {phoneNumber},
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "User already exists with this phone number",
                });
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            const messageService = MessageServiceFactory.create();
            await messageService.sendOtp(phoneNumber, otp);

            await prisma.otpCode.create({
                data: {
                    code: otp,
                    phoneNumber,
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                },
            });

            res.json({success: true, message: "Verification code sent successfully"});
        } catch (error) {
            next(error);
        }
    }

    // ----------------------------
    // 2️⃣ Verify OTP
    // ----------------------------
    async verifySignupOtp(req, res, next) {
        try {
            const {phoneNumber, otp} = req.body;

            const otpRecord = await prisma.otpCode.findFirst({
                where: {
                    phoneNumber,
                    code: otp,
                    isUsed: false,
                    expiresAt: {gt: new Date()},
                },
            });

            if (!otpRecord) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired verification code",
                });
            }

            await prisma.otpCode.update({
                where: {id: otpRecord.id},
                data: {isUsed: true},
            });

            res.json({success: true, message: "Phone number verified successfully"});
        } catch (error) {
            next(error);
        }
    }

    // ----------------------------
    // 3️⃣ Login with role + permissions
    // ----------------------------
    async login(req, res, next) {
        try {
            const {email, password} = req.body;

            const user = await prisma.user.findUnique({
                where: {email},
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                include: {permission: true},
                            },
                        },
                    },
                },
            });

            if (!user)
                return res.status(401).json({success: false, message: "Invalid credentials"});
            if (!user.isActive)
                return res.status(401).json({success: false, message: "Account is deactivated"});
            if (!user.isVerified)
                return res.status(401).json({
                    success: false,
                    message: "Account not verified. Please complete signup first.",
                });

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid)
                return res.status(401).json({success: false, message: "Invalid credentials"});

            const {accessToken, refreshToken} = authService.generateTokens(user.id);

            await prisma.refreshToken.deleteMany({where: {userId: user.id}});
            await prisma.refreshToken.create({
                data: {
                    token: refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            });

            // Build permissions array (flattened)
            const permissions =
                user.role?.rolePermissions?.map((rp) => ({
                    id: rp.permission.id,
                    name: rp.permission.name,
                    module: rp.permission.module,
                    action: rp.permission.action,
                    description: rp.permission.description,
                })) || [];

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
                        role: user.role?.name || null,
                        permissions,
                    },
                    accessToken,
                    refreshToken,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // ----------------------------
    // 4️⃣ Signup — SuperAdmin Logic
    // ----------------------------
    async signup(req, res, next) {
        try {
            const {firstName, lastName, email, password, phone} = req.body;

            // 🔍 Validate duplicate email
            const existingUserByEmail = await prisma.user.findUnique({where: {email}});
            if (existingUserByEmail) {
                return res
                    .status(400)
                    .json({success: false, message: "User already exists with this email"});
            }

            // 🔍 Validate duplicate phone
            const existingUserByPhone = await prisma.user.findUnique({
                where: {phoneNumber: phone},
            });
            if (existingUserByPhone) {
                return res.status(400).json({
                    success: false,
                    message: "User already exists with this phone number",
                });
            }

            // 🧩 Determine role → first user = SuperAdmin
            const roleName = "SuperAdmin";

            const role = await prisma.role.findUnique({where: {name: roleName}});
            if (!role) {
                return res.status(500).json({
                    success: false,
                    message: `${roleName} role not found. Please seed database.`,
                });
            }

            // 🔐 Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // 🧠 Create user (selecting safe fields only)
            const user = await prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    phoneNumber: phone,
                    password: hashedPassword,
                    isVerified: true,
                    roleId: role.id,
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
                    role: {select: {name: true}},
                },
            });

            // 🎟️ Generate tokens
            const {accessToken, refreshToken} = authService.generateTokens(user.id);

            await prisma.refreshToken.deleteMany({where: {userId: user.id}});
            await prisma.refreshToken.create({
                data: {
                    token: refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            });

            // 🎉 Success response
            res.status(201).json({
                success: true,
                message: `Account created successfully as ${roleName}`,
                data: {
                    user,
                    accessToken,
                    refreshToken,
                },
            });
        } catch (error) {
            console.error("Signup Error:", error);
            next(error);
        }
    }
}


module.exports = new AuthController();
