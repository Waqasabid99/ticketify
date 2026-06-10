import { UserRole, UserStatus } from "../generated/prisma/enums.ts";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.service.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { clearAuthCookies, comparePassword, generateAccessToken, generatePasswordResetToken, generateRefreshToken, getSafeUser, hashPassword, JWT_REFRESH_EXPIRES_IN, setAuthCookies, verifyPasswordResetToken } from "../utils/helper.js";
import prisma from "../config/prisma.js";
import ms from "ms";

export const registerUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, phone } = req.body;

    // Validate required fields
    if (!firstName || !email || !password) throw ApiError.badRequest("Name, email and password are required");

    if (password.length < 8) throw ApiError.badRequest("Password must be at least 8 characters long");

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) throw ApiError.conflict("User already exists with this email");

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
        data: {
            firstName,
            lastName: lastName || null,
            email,
            passwordHash,
            phone: phone || null,
            role: UserRole.CUSTOMER,
            status: UserStatus.PENDING,
            emailVerified: false,
        },
    });

    const permissions = await prisma.rolePermission.findMany({
        where: {
            role: user?.role,
        },
        include: {
            permission: true,
        },
    });

    const safeUser = getSafeUser(user);
    await sendVerificationEmail(safeUser);


    return apiResponse(res, 201, true, "User registered successfully", {
        user: safeUser,
        permissions: permissions.map((rp) => rp.permission.name),
    });
});

export const adminRegisterUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, phone, role, status, emailVerified } = req.body;

    // Validate required fields
    if (!firstName || !email || !password) throw ApiError.badRequest("Name, email and password are required");

    if (password.length < 8) throw ApiError.badRequest("Password must be at least 8 characters long");

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) throw ApiError.conflict("User already exists with this email");

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
        data: {
            firstName,
            lastName: lastName || null,
            email,
            passwordHash,
            phone: phone || null,
            role: role?.toUpperCase() || UserRole.CUSTOMER,
            status: status?.toUpperCase() || UserStatus.PENDING,
            emailVerified: emailVerified || false,
        },
    });

    const permissions = await prisma.rolePermission.findMany({
        where: {
            role: user?.role,
        },
        include: {
            permission: true,
        },
    });

    const safeUser = getSafeUser(user);

    return apiResponse(res, 201, true, "User registered successfully", {
        user: safeUser,
        permissions: permissions.map((rp) => rp.permission.name),
    });
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) throw ApiError.badRequest("Email and password are required");

    const user = await prisma.user.findFirst({
        where: {
            email,
            deletedAt: null,
        },
    });

    if (!user) {
        throw ApiError.unauthorized("Invalid email or password");
    }

    const permissions = await prisma.rolePermission.findMany({
        where: {
            role: user?.role,
        },
        include: {
            permission: true,
        },
    });

    if (!permissions || permissions.length === 0) {
        throw ApiError.unauthorized("Failed to fetch permissions. Try again later.");
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) throw ApiError.unauthorized("Invalid email or password");

    if (!user.emailVerified) {
        await sendVerificationEmail(user);
        throw ApiError.unauthorized("Please verify your email first.");
    }

    if (user.status !== UserStatus.ACTIVE) {
        throw ApiError.unauthorized("Your account is not active. Please contact the administrator.");
    }

    const safeUser = getSafeUser(user);
    const accessToken = generateAccessToken(safeUser);
    const refreshToken = generateRefreshToken(safeUser);

    const tokenHash = await hashPassword(refreshToken);

    const refreshMaxAge = rememberMe
        ? ms("30d")
        : (process.env.REFRESH_TOKEN_MAX_AGE ? ms(process.env.REFRESH_TOKEN_MAX_AGE) : ms("7d"));

    await prisma.refreshToken.create({
        data: {
            tokenHash,
            userId: user.id,
            ipHash: req.ip,
            userAgent: req.headers["user-agent"],
            expiresAt: new Date(Date.now() + refreshMaxAge),
        },
    });

    setAuthCookies(
        res,
        accessToken,
        refreshToken,
        refreshMaxAge
    );
    return apiResponse(res, 200, true, "User logged in successfully", {
        user: safeUser,
        permissions: permissions.map((rp) => rp.permission.name),
    });
});

export const logoutUser = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) throw ApiError.badRequest("Token not found");

    if (refreshToken) {
        const tokens = await prisma.refreshToken.findMany({
            where: { expiresAt: { gt: new Date() } },
        });

        for (const token of tokens) {
            const isMatch = await comparePassword(refreshToken, token.tokenHash);

            if (isMatch) {
                await prisma.refreshToken.delete({
                    where: { id: token.id },
                });
                break;
            }
        }
    }

    clearAuthCookies(res);

    return apiResponse(res, 200, true, "Logout successful");
});

export const verifyUsers = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) throw ApiError.unauthorized("User not found");

    const permissions = await prisma.rolePermission.findMany({
        where: {
            role: user?.role,
        },
        include: {
            permission: true,
        },
    });

    return apiResponse(res, 200, true, "User verified successfully", { user: getSafeUser(user), permissions: permissions.map((rp) => rp.permission.name) });
})

export const refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) throw ApiError.unauthorized("Refresh token not found");

    const tokens = await prisma.refreshToken.findMany({
        where: {
            expiresAt: { gt: new Date() },
        },
    });

    let matchedToken = null;

    for (const token of tokens) {
        const isMatch = await comparePassword(refreshToken, token.tokenHash);
        if (isMatch) {
            matchedToken = token;
            break;
        }
    }

    if (!matchedToken) throw ApiError.badRequest("Invalid refresh token");

    const user = await prisma.user.findUnique({
        where: { id: matchedToken.userId }
    });

    if (!user) throw ApiError.notFound("User not found");

    if (!user.emailVerified) {
        await sendVerificationEmail(user);
        throw ApiError.unauthorized("Please verify your email first.");
    }

    if (user.status !== UserStatus.ACTIVE) {
        throw ApiError.unauthorized("Your account is not active. Please contact the administrator.");
    }

    const safeUser = getSafeUser(user);

    const newAccessToken = generateAccessToken(safeUser);
    const newRefreshToken = generateRefreshToken(safeUser);

    const newHash = await hashPassword(newRefreshToken);

    // delete old refresh token (rotation)
    await prisma.refreshToken.delete({
        where: { id: matchedToken.id },
    });

    // create new refresh token
    await prisma.refreshToken.create({
        data: {
            tokenHash: newHash,
            userId: user.id,
            ipHash: req.ip,
            userAgent: req.headers["user-agent"],
            expiresAt: new Date(Date.now() + ms(JWT_REFRESH_EXPIRES_IN)),
        },
    });

    setAuthCookies(res, newAccessToken, newRefreshToken);

    return apiResponse(res, 200, true, "Token refreshed");
});

// Forget password — generates a reset token and emails a link
export const forgetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) throw ApiError.badRequest("Email is required");

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return 200 so we don't reveal whether an account exists
    if (!user) {
        return apiResponse(res, 200, true, "If that email is registered, a reset link has been sent.");
    }

    if (!user.emailVerified) {
        await sendVerificationEmail(user);
        throw ApiError.unauthorized("Please verify your email first.");
    }

    if (user.status !== UserStatus.ACTIVE) {
        throw ApiError.unauthorized("Your account is not active. Please contact the administrator.");
    }

    const resetToken = generatePasswordResetToken(user.id);
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordResetToken: resetToken,
            passwordResetExpiry: resetExpiry,
        },
    });

    await sendPasswordResetEmail(user, resetToken);

    return apiResponse(res, 200, true, "If that email is registered, a reset link has been sent.");
});

// Verify password reset token and set new password
export const verifyPasswordReset = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) throw ApiError.badRequest("Token and new password are required");

    if (newPassword.length < 8) throw ApiError.badRequest("Password must be at least 8 characters long");

    const decoded = verifyPasswordResetToken(token);

    const user = await prisma.user.findFirst({
        where: {
            id: decoded.userId,
            passwordResetToken: token,
            passwordResetExpiry: { gt: new Date() },
        },
    });

    if (!user) throw ApiError.badRequest("Invalid or expired password reset token");

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash: hashedPassword,
            passwordResetToken: null,
            passwordResetExpiry: null,
        },
    });

    // Invalidate all refresh tokens for security
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return apiResponse(res, 200, true, "Password reset successfully. Please log in with your new password.");
});

// Chnage password
export const resetPassword = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw ApiError.badRequest("Missing required fields");
    }

    if (newPassword.length < 8) {
        throw ApiError.badRequest("Password must be at least 8 characters long");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) throw ApiError.notFound("User not found");

    if (!user.emailVerified) {
        await sendVerificationEmail(user);
        throw ApiError.unauthorized("Please verify your email first.");
    }

    if (user.status !== UserStatus.ACTIVE) {
        throw ApiError.unauthorized("Your account is not active. Please contact the administrator.");
    }

    const isMatch = await comparePassword(oldPassword, user.passwordHash);

    if (oldPassword === newPassword) {
        throw ApiError.badRequest(
            "New password must be different"
        );
    }

    if (!isMatch) throw ApiError.unauthorized("Invalid old password");

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
    });

    await prisma.refreshToken.deleteMany({
        where: { userId },
    });

    return apiResponse(res, 200, true, "Password updated");
});
