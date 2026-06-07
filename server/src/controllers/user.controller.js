import prisma from "../config/prisma.js";
import { UserStatus } from "../generated/prisma/enums.ts";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { getSafeUser, hashPassword } from "../utils/helper.js";

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "User123!";

export const getUser = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) throw ApiError.unauthorized("User not found");

    return apiResponse(res, 200, true, "User fetched successfully", user);
});

export const updateCurrentUser = asyncHandler(async (req, res) => {
    const { id } = req.user;
    const { firstName, lastName, phone } = req.body;

    let updateData = {};

    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (phone) updateData.phone = phone.trim();

    if (Object.keys(updateData).length === 0) {
        throw ApiError.badRequest(
            "No fields provided for update"
        );
    }

    const user = await prisma.user.update({
        where: { id },
        data: updateData,
    });

    const safeUser = getSafeUser(user);

    return apiResponse(res, 200, true, "User updated successfully", safeUser);
});

export const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, role, status, search } = req.query;

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    const skip = (pageNumber - 1) * pageSize;

    const where = { deletedAt: null };

    if (role) where.role = role.toUpperCase();
    if (status) where.status = status.toUpperCase();
    if (search) where.OR = [
        {
            firstName: {
                contains: search,
                mode: "insensitive",
            },
        },
        {
            lastName: {
                contains: search,
                mode: "insensitive",
            },
        },
        {
            email: {
                contains: search,
                mode: "insensitive",
            },
        },
    ];

    const users = await prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const totalUsers = await prisma.user.count({
        where,
    });

    return apiResponse(res, 200, true, "Users fetched successfully", {
        users,
        totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / pageSize)
    });
});

export const getUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) throw ApiError.badRequest("User ID is required");

    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            deletedAt: null,
        },
    });

    if (!user) throw ApiError.notFound("User not found");
    if (user.status === UserStatus.INACTIVE) throw ApiError.badRequest("User is inactive");

    const safeUser = getSafeUser(user);
    return apiResponse(res, 200, true, "User fetched successfully", safeUser);
});

export const createUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, password, role, status } = req.body;

    if (!firstName) throw ApiError.badRequest("Name is required");

    const user = await prisma.user.findFirst({
        where: {
            email,
            deletedAt: null,
        },
    });

    if (user) throw ApiError.badRequest("User already exists");

    let hashedPassword;

    if (password && password.trim().length > 0) {
        hashedPassword = await hashPassword(password);
    } else {
        hashedPassword = await hashPassword(DEFAULT_PASSWORD)
    }

    const newUser = await prisma.user.create({
        data: {
            firstName: firstName.trim(),
            lastName: lastName || "",
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || "",
            passwordHash: hashedPassword,
            role: role?.toUpperCase() || "CUSTOMER",
            status: status?.toUpperCase() || "PENDING",
        },
    });

    const safeUser = getSafeUser(newUser);

    return apiResponse(res, 200, true, "User created successfully", safeUser);
});

export const updateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { firstName, lastName, email, phone, verified, verificationToken, verificationExpiry } = req.body;

    if (!userId) throw ApiError.badRequest("User ID is required");

    let updateData = {};

    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (phone) updateData.phone = phone.trim();
    if (verified !== undefined) updateData.emailVerified = Boolean(verified);
    if (verificationToken !== undefined) updateData.emailVerificationToken = verificationToken;
    if (verificationExpiry !== undefined) updateData.emailVerificationExpiry = new Date(verificationExpiry);

    if (Object.keys(updateData).length === 0) {
        throw ApiError.badRequest("No fields provided for update");
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            id: userId,
            deletedAt: null,
        },
    });

    if (!existingUser) throw ApiError.notFound("User not found");

    const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
    });

    const safeUser = getSafeUser(user);

    return apiResponse(res, 200, true, "User updated successfully", safeUser);
});

export const updateUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!userId) throw ApiError.badRequest("User ID is required");
    if (!role) throw ApiError.badRequest("Role is required");

    const existingUser = await prisma.user.findFirst({
        where: {
            id: userId,
            deletedAt: null,
        },
    });

    if (!existingUser) throw ApiError.notFound("User not found");

    const allowedRoles = [
        "OWNER",
        "MANAGER",
        "STAFF",
        "CUSTOMER"
    ];

    if (!allowedRoles.includes(role.toUpperCase())) {
        throw ApiError.badRequest("Invalid role");
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            role: role.toUpperCase(),
        },
    });

    const safeUser = getSafeUser(user);

    return apiResponse(res, 200, true, "User role updated successfully", safeUser);
});

export const updateUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    if (!userId) throw ApiError.badRequest("User ID is required");
    if (!status) throw ApiError.badRequest("Status is required");

    const existingUser = await prisma.user.findFirst({
        where: {
            id: userId,
            deletedAt: null,
        },
    });

    if (!existingUser) throw ApiError.notFound("User not found");

    const allowedStatuses = [
        "PENDING",
        "ACTIVE",
        "INACTIVE",
        "BLOCKED"
    ];

    if (!allowedStatuses.includes(status.toUpperCase())) {
        throw ApiError.badRequest("Invalid status");
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            status: status.toUpperCase(),
        },
    });

    const safeUser = getSafeUser(user);

    return apiResponse(res, 200, true, "User status updated successfully", safeUser);
});

export const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) throw ApiError.badRequest("User ID is required");

    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            deletedAt: null,
        },
    });

    if (!user) throw ApiError.notFound("User not found");

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            status: "INACTIVE",
            deletedAt: new Date(),
        }
    });

    const safeUser = getSafeUser(updatedUser);

    return apiResponse(res, 200, true, "User deleted successfully", safeUser);
});
