import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ApiError } from "./error.js";
import ms from "ms";
import slugify from "slugify";

export const JWT_EXPIRES_IN = process.env.NODE_ENV === "production"
    ? (process.env.JWT_EXPIRES_IN || "24h")
    : "15m";

export const JWT_REFRESH_EXPIRES_IN = process.env.NODE_ENV === "production"
    ? (process.env.JWT_REFRESH_EXPIRES_IN || "7d")
    : "30m";

export const JWT_ACCESS_SECRET = process.env.NODE_ENV === "production"
    ? process.env.JWT_ACCESS_SECRET
    : "jwt-secret-access";

export const JWT_REFRESH_SECRET = process.env.NODE_ENV === "production"
    ? process.env.JWT_REFRESH_SECRET
    : "jwt-secret-refresh";

export const SALT_ROUNDS = process.env.NODE_ENV === "production"
    ? Number(process.env.SALT_ROUNDS) || 10
    : 10;

export const JWT_VERIFICATION_SECRET = process.env.NODE_ENV === "production"
    ? process.env.JWT_VERIFICATION_SECRET
    : "jwt-secret-verification";

export const JWT_VERIFICATION_EXPIRES_IN = process.env.NODE_ENV === "production"
    ? (process.env.JWT_VERIFICATION_EXPIRES_IN || "10m")
    : "15m";

export const JWT_PASSWORD_RESET_SECRET = process.env.NODE_ENV === "production"
    ? process.env.JWT_PASSWORD_RESET_SECRET
    : "jwt-secret-password-reset";

export const JWT_PASSWORD_RESET_EXPIRES_IN = process.env.NODE_ENV === "production"
    ? (process.env.JWT_PASSWORD_RESET_EXPIRES_IN || "10m")
    : "15m";

// Create Access token 
export const generateAccessToken = (payload) => {
    return jwt.sign(
        {
            ...payload,
            tokenType: "access",
        },
        JWT_ACCESS_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// Create refresh token
export const generateRefreshToken = (payload) => {
    return jwt.sign(
        {
            ...payload,
            tokenType: "refresh",
        },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
};

// Verify access token
export const verifyAccessToken = (token) => {
    const decoded = jwt.verify(
        token,
        JWT_ACCESS_SECRET
    );

    if (decoded.tokenType !== "access") {
        throw ApiError.unauthorized("Invalid token type");
    }

    return decoded;
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
    const decoded = jwt.verify(
        token,
        JWT_REFRESH_SECRET
    );

    if (decoded.tokenType !== "refresh") {
        throw ApiError.unauthorized("Invalid token type");
    }

    return decoded;
};

// Hash password
export const hashPassword = async (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

// Compare password
export const comparePassword = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};

// Cookie Options 
export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
        process.env.NODE_ENV === "production"
            ? "strict"
            : "lax",
};

export const setAuthCookies = (res, accessToken, refreshToken, refreshMaxAge) => {
    if (accessToken) {
        res.cookie("accessToken", accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: process.env.TOKEN_MAX_AGE ? ms(process.env.TOKEN_MAX_AGE) : ms("15m"),
        });
    }

    if (refreshToken) {
        res.cookie("refreshToken", refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: refreshMaxAge != null ? refreshMaxAge : (process.env.REFRESH_TOKEN_MAX_AGE ? ms(process.env.REFRESH_TOKEN_MAX_AGE) : ms("7d")),
        });
    }
};

// Clear auth cookies
export const clearAuthCookies = (res) => {
    res.clearCookie("accessToken", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
};

// Get safe user object (remove passwordHash)
export const getSafeUser = (user) => {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
};

export const generateVerificationToken = (userId) => {
    return jwt.sign({
        userId,
        tokenType: "verification",
    },
        JWT_VERIFICATION_SECRET,
        { expiresIn: JWT_VERIFICATION_EXPIRES_IN });
}

export const verifyVerificationToken = (token) => {
    console.log("token is this ", token)
    try {
        const decoded = jwt.verify(
            token,
            JWT_VERIFICATION_SECRET
        );

        if (decoded.tokenType !== "verification") {
            throw ApiError("Invalid token type", 401);
        }

        return decoded;
    } catch (error) {
        console.log(error)
        throw ApiError("Invalid or expired verification token", 401);
    }
};

export const generatePasswordResetToken = (userId) => {
    return jwt.sign({
        userId,
        tokenType: "passwordReset",
    },
        JWT_PASSWORD_RESET_SECRET,
        { expiresIn: JWT_PASSWORD_RESET_EXPIRES_IN });
};

export const verifyPasswordResetToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_PASSWORD_RESET_SECRET);

        if (decoded.tokenType !== "passwordReset") {
            throw ApiError.unauthorized("Invalid token type");
        }

        return decoded;
    } catch (error) {
        throw ApiError.unauthorized("Invalid or expired password reset token");
    }
};

export const generateSlug = (text) =>
    slugify(text, {
        lower: true,
        strict: true,
        trim: true,
    });

export const generateUniqueSlug = async (name, prismaModel, excludeId = null, deletedAt) => {
    if (!name) throw ApiError.badRequest("Name is required");

    const baseSlug = generateSlug(name);

    const where = {
        slug: {
            startsWith: baseSlug,
        },
    };

    if (deletedAt !== undefined) {
        where.deletedAt = deletedAt;
    }

    if (excludeId) where.id = { not: excludeId };

    const existing = await prismaModel.findMany({
        where,
        select: {
            slug: true,
        },
    });

    const slugs = new Set(existing.map((item) => item.slug));

    if (!slugs.has(baseSlug)) {
        return baseSlug;
    }

    let counter = 1;

    while (slugs.has(`${baseSlug}-${counter}`)) {
        counter++;
    }

    return `${baseSlug}-${counter}`;
};