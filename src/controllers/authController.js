const authService = require("../services/authService");
const MessageServiceFactory = require("../services/messageServiceFactory");
const bcrypt = require("bcryptjs");
const {PrismaClient} = require("@prisma/client");

const prisma = new PrismaClient();

class AuthController {
    async sendSignupOtp(req, res, next) {
        try {
            const {phoneNumber} = req.body;
            const existingUser = await prisma.user.findUnique({where: {phoneNumber}});
            if (existingUser)
                return res.status(400).json({success: false, message: "User already exists with this phone number"});

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const messageService = MessageServiceFactory.create();
            await messageService.sendOtp(phoneNumber, otp);
            await prisma.otpCode.create({
                data: {code: otp, phoneNumber, expiresAt: new Date(Date.now() + 5 * 60 * 1000)},
            });
            res.json({success: true, message: "Verification code sent successfully"});
        } catch (error) {
            next(error);
        }
    }

    async verifySignupOtp(req, res, next) {
        try {
            const {phoneNumber, otp} = req.body;
            const otpRecord = await prisma.otpCode.findFirst({
                where: {phoneNumber, code: otp, isUsed: false, expiresAt: {gt: new Date()}},
            });
            if (!otpRecord)
                return res.status(400).json({success: false, message: "Invalid or expired verification code"});

            await prisma.otpCode.update({where: {id: otpRecord.id}, data: {isUsed: true}});
            res.json({success: true, message: "Phone number verified successfully"});
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const {email, password} = req.body;

            const user = await prisma.user.findUnique({
                where: {email},
                include: {
                    role: {
                        include: {
                            rolePermissions: {include: {permission: true}}
                        }
                    },
                    company: true,
                    store: true   // <--- returns store info if assigned
                }
            });

            if (!user)
                return res.status(401).json({success: false, message: "Invalid credentials"});

            if (!user.isActive)
                return res.status(401).json({success: false, message: "Account is deactivated"});

            const valid = await bcrypt.compare(password, user.password);
            if (!valid)
                return res.status(401).json({success: false, message: "Invalid credentials"});

            const {accessToken, refreshToken} = authService.generateTokens(user.id);

            await prisma.refreshToken.deleteMany({where: {userId: user.id}});
            await prisma.refreshToken.create({
                data: {
                    token: refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });

            // ⭐ GET ONLY ROLE VISIBILITY USERS (with store info)
            const roleVisibility = await prisma.roleUserVisibility.findMany({
                where: {roleId: user.roleId},
                include: {
                    target: {
                        include: {
                            store: true,      // <--- returns store info for each visible user
                            company: true
                        }
                    }
                }
            });

            // Clean visibility users
            const visibilityUsers = roleVisibility.map(v => ({
                id: v.target.id,
                firstName: v.target.firstName,
                lastName: v.target.lastName,
                email: v.target.email,
                phoneNumber: v.target.phoneNumber,
                companyId: v.target.companyId,
                storeId: v.target.storeId,
                store: v.target.store   // <--- store info included here
            }));

            // ⭐ Clean Role
            const cleanRole = {
                id: user.role.id,
                name: user.role.name,
                description: user.role.description
            };

            // ⭐ Clean Permissions
            const permissions = user.role.rolePermissions.map(rp => ({
                id: rp.permission.id,
                name: rp.permission.name,
                module: rp.permission.module,
                action: rp.permission.action
            }));

            // ⭐ Final Response
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

                        // Company & Store Info
                        companyId: user.companyId,
                        storeId: user.storeId,
                        company: user.company,
                        store: user.store,   // WILL BE null only if user has no store

                        // Role & Permissions
                        role: cleanRole,
                        permissions,

                        // Visibility with store info
                        visibility: visibilityUsers
                    },
                    accessToken,
                    refreshToken
                }
            });

        } catch (err) {
            next(err);
        }
    }


    async signup(req, res, next) {
        try {
            const {firstName, lastName, email, password, phone, companyName, domain, userLimit} = req.body;
            const existingUser = await prisma.user.findUnique({where: {email}});
            if (existingUser)
                return res.status(400).json({success: false, message: "User already exists with this email"});

            const existingPhone = await prisma.user.findUnique({where: {phoneNumber: phone}});
            if (existingPhone)
                return res.status(400).json({success: false, message: "User already exists with this phone number"});

            if (!companyName || !domain)
                return res.status(400).json({success: false, message: "Company name and domain are required"});

            const company = await prisma.company.create({
                data: {name: companyName, domain, userLimit: userLimit || 100},
            });

            const role = await prisma.role.findUnique({where: {name: "SuperAdmin"}});
            if (!role)
                return res.status(500).json({success: false, message: "SuperAdmin role missing. Seed roles first."});

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
                include: {role: true, company: true},
            });

            const {accessToken, refreshToken} = authService.generateTokens(user.id);
            await prisma.refreshToken.deleteMany({where: {userId: user.id}});
            await prisma.refreshToken.create({
                data: {
                    token: refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                },
            });

            res.status(201).json({
                success: true,
                message: "Company registered and SuperAdmin created successfully",
                data: {user, company, accessToken, refreshToken},
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
