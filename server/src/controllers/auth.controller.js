import { UserRole, UserStatus } from "../generated/prisma/enums.ts";
import { sendVerificationEmail } from "../services/email.service.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { clearAuthCookies, comparePassword, generateAccessToken, generateRefreshToken, getSafeUser, hashPassword, JWT_REFRESH_EXPIRES_IN, setAuthCookies } from "../utils/helper.js";
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

    const safeUser = getSafeUser(user);
    await sendVerificationEmail(safeUser);


    return apiResponse(res, 201, true, "User registered successfully", safeUser);
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

    const safeUser = getSafeUser(user);

    return apiResponse(res, 201, true, "User registered successfully", safeUser);
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) throw ApiError.badRequest("Email and password are required");

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) throw ApiError.notFound("Invalid email or password");

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
    return apiResponse(res, 200, true, "User logged in successfully", safeUser);
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

// forget password
export const forgetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) throw ApiError.notFound("User not found");

    if (!user.emailVerified) {
        await sendVerificationEmail(user);
        throw ApiError.unauthorized("Please verify your email first.");
    }

    if (user.status !== UserStatus.ACTIVE) {
        throw ApiError.unauthorized("Your account is not active. Please contact the administrator.");
    }

    // Hash Password
    const hashedPassword = await hashPassword(password);

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash: hashedPassword,
        },
    });

    // Get safeUser
    const safeUser = getSafeUser(updatedUser);
    return apiResponse(res, 200, true, "Password updated", { user: safeUser });
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
