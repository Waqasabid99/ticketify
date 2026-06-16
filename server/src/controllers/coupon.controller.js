import prisma from "../config/prisma.js";
import { CouponType } from "../generated/prisma/enums.ts";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";

export const createCoupon = asyncHandler(async (req, res) => {
    const { code, type, value, maxUses, startsAt, expiresAt, isActive } = req.body;

    if (!code || !type || !value || !maxUses || !startsAt || !expiresAt)
        throw ApiError.badRequest("All Fields are required.");

    if (new Date(startsAt) < new Date())
        throw ApiError.badRequest("Coupon start date cannot be in past.");
    if (new Date(expiresAt) < new Date())
        throw ApiError.badRequest("Coupon expires date cannot be in past.");

    const exists = await prisma.coupon.findFirst({
        where: {
            code: code.toUpperCase(),
            deletedAt: null,
        },
    });

    if (exists) throw ApiError.conflict("Coupon code exists already.");

    const allowedTypes = Object.values(CouponType);
    const cType = type.toUpperCase();
    if (!allowedTypes.includes(cType)) throw ApiError.badRequest("Coupon type not found.");

    const coupon = await prisma.$transaction(async (tx) => {
        const newCoupon = await tx.coupon.create({
            data: {
                code: code.toUpperCase(),
                type: cType,
                value,
                maxUses: Number(maxUses),
                startsAt,
                expiresAt,
                isActive: isActive ?? true,
            },
        });

        await tx.auditLog.create({
            data: {
                userId: req.user?.id,
                action: "COUPON_CREATED",
                entity: "COUPON",
                entityId: newCoupon.id,
                metadata: {
                    ipAddress: req.ip,
                    userAgent: req.headers?.["user-agent"],
                },
            },
        });

        return newCoupon;
    });

    return apiResponse(res, 201, true, "Coupon created successfully", coupon);
});

export const getAllCoupons = asyncHandler(async (req, res) => {
    const { page = 1, limit = 100, orderBy = "desc" } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNumber - 1) * pageSize;

    // FIX #8: Removed redundant `await` inside Promise.all
    const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
            where: { deletedAt: null },
            skip,
            take: pageSize,
            orderBy: { createdAt: orderBy },
        }),
        prisma.coupon.count({
            where: { deletedAt: null },
        }),
    ]);

    return apiResponse(res, 200, true, "Coupons fetched successfully.", {
        coupons,
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
});

export const getCouponById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest("Coupon ID is required.");

    const coupon = await prisma.coupon.findFirst({
        where: { id, deletedAt: null },
    });

    if (!coupon) throw ApiError.notFound("Coupon not found.");

    return apiResponse(res, 200, true, "Coupon fetched successfully.", coupon);
});

export const updateCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { code, type, value, maxUses, startsAt, expiresAt } = req.body;

    if (!id) throw ApiError.badRequest("Coupon ID is required.");

    if (startsAt && new Date(startsAt) < new Date())
        throw ApiError.badRequest("Coupon start date cannot be in past.");
    if (expiresAt && new Date(expiresAt) < new Date())
        throw ApiError.badRequest("Coupon expires date cannot be in past.");

    const existingCoupon = await prisma.coupon.findFirst({
        where: { id, deletedAt: null },
    });

    if (!existingCoupon) throw ApiError.notFound("Coupon not found.");

    if (code) {
        const codeConflict = await prisma.coupon.findFirst({
            where: {
                code: code.toUpperCase(),
                deletedAt: null,
                NOT: { id },
            },
        });
        if (codeConflict) throw ApiError.conflict("Coupon code already exists.");
    }

    const updateData = {};
    if (code) updateData.code = code.toUpperCase();
    if (type) {
        const allowedTypes = Object.values(CouponType);
        const cType = type.toUpperCase();
        if (!allowedTypes.includes(cType)) throw ApiError.badRequest("Coupon type not found.");
        updateData.type = cType;
    }
    if (value) updateData.value = value;
    if (maxUses) updateData.maxUses = parseInt(maxUses, 10);
    if (startsAt) updateData.startsAt = startsAt;
    if (expiresAt) updateData.expiresAt = expiresAt;

    if (Object.keys(updateData).length === 0)
        throw ApiError.badRequest("No fields provided for update.");

    const coupon = await prisma.$transaction(async (tx) => {
        const updatedCoupon = await tx.coupon.update({
            where: { id },
            data: updateData,
        });

        await tx.auditLog.create({
            data: {
                userId: req.user?.id,
                action: "COUPON_UPDATED",
                entity: "COUPON",
                entityId: updatedCoupon.id,
                metadata: {
                    ipAddress: req.ip,
                    userAgent: req.headers?.["user-agent"],
                },
            },
        });

        return updatedCoupon;
    });

    return apiResponse(res, 200, true, "Coupon updated successfully.", coupon);
});

export const updateCouponStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!id) throw ApiError.badRequest("Coupon ID is required.");
    if (typeof isActive !== "boolean") throw ApiError.badRequest("Status must be boolean.");

    const existingCoupon = await prisma.coupon.findFirst({
        where: { id, deletedAt: null },
    });

    if (!existingCoupon) throw ApiError.notFound("Coupon not found.");

    const coupon = await prisma.$transaction(async (tx) => {
        const updatedCoupon = await tx.coupon.update({
            where: { id },
            data: { isActive },
        });

        await tx.auditLog.create({
            data: {
                userId: req.user?.id,
                action: "COUPON_STATUS_UPDATED",
                entity: "COUPON",
                entityId: updatedCoupon.id,
                metadata: {
                    ipAddress: req.ip,
                    userAgent: req.headers?.["user-agent"],
                },
            },
        });

        return updatedCoupon;
    });

    return apiResponse(res, 200, true, "Coupon status updated successfully.", coupon);
});

export const deleteCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest("Coupon ID is required.");

    const coupon = await prisma.coupon.findFirst({
        where: { id, deletedAt: null },
    });

    if (!coupon) throw ApiError.notFound("Coupon not found.");

    await prisma.$transaction(async (tx) => {
        await tx.coupon.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        await tx.auditLog.create({
            data: {
                userId: req.user?.id,
                action: "COUPON_DELETED",
                entity: "COUPON",
                entityId: coupon.id,
                metadata: {
                    ipAddress: req.ip,
                    userAgent: req.headers?.["user-agent"],
                },
            },
        });
    });

    return apiResponse(res, 200, true, "Coupon deleted successfully.");
});

export const applyCoupon = asyncHandler(async (req, res) => {
    const { code, bookingId } = req.body;

    if (!code || !bookingId)
        throw ApiError.badRequest("Coupon code and booking ID are required.");

    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            userId: req.user.id,
        },
    });

    if (!booking) throw ApiError.notFound("Booking not found.");

    const applyDiscount = await validateCoupon(code, bookingId);

    const totalAmount = Number(booking.totalAmount);
    const finalAmount = applyDiscount(totalAmount);
    const discountAmount = totalAmount - finalAmount;

    const coupon = await prisma.coupon.findFirst({
        where: { code: code.toUpperCase(), deletedAt: null },
    });

    await prisma.$transaction(async (tx) => {
        await tx.couponUsage.create({
            data: {
                couponId: coupon.id,
                bookingId,
                userId: req.user.id,
            },
        });

        await tx.booking.update({
            where: { id: bookingId },
            data: {
                couponId: coupon.id,
                discountAmount,
                finalAmount,
            },
        });

        await tx.auditLog.create({
            data: {
                userId: req.user.id,
                action: "COUPON_APPLIED",
                entity: "COUPON_USAGE",
                entityId: coupon.id,
                metadata: {
                    bookingId,
                    discountAmount,
                    finalAmount,
                    ipAddress: req.ip,
                    userAgent: req.headers?.["user-agent"],
                },
            },
        });
    });

    return apiResponse(res, 200, true, "Coupon applied successfully.", {
        totalAmount,
        discountAmount,
        finalAmount,
    });
});

export const removeCoupon = asyncHandler(async (req, res) => {
    const { couponId, bookingId } = req.body;

    if (!couponId || !bookingId)
        throw ApiError.badRequest("Coupon ID and booking ID are required.");

    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            userId: req.user.id,
        },
    });

    if (!booking) throw ApiError.notFound("Booking not found.");

    const usage = await prisma.couponUsage.findUnique({
        where: {
            couponId_bookingId: { couponId, bookingId },
        },
    });

    if (!usage) throw ApiError.notFound("Coupon is not applied to this booking.");

    await prisma.$transaction(async (tx) => {
        await tx.couponUsage.delete({
            where: {
                couponId_bookingId: { couponId, bookingId },
            },
        });

        await tx.auditLog.create({
            data: {
                userId: req.user?.id,
                action: "COUPON_REMOVED",
                entity: "COUPON_USAGE",
                entityId: couponId,
                metadata: {
                    bookingId,
                    ipAddress: req.ip,
                    userAgent: req.headers?.["user-agent"],
                },
            },
        });
    });

    return apiResponse(res, 200, true, "Coupon removed successfully.");
});

export const getCouponUsages = asyncHandler(async (req, res) => {
    const { couponId } = req.params;
    if (!couponId) throw ApiError.badRequest("Coupon ID is required.");

    const coupon = await prisma.coupon.findFirst({
        where: { id: couponId, deletedAt: null },
    });

    if (!coupon) throw ApiError.notFound("Coupon not found.");

    const couponUsages = await prisma.couponUsage.findMany({
        where: { couponId },
        include: {
            coupon: true,
            booking: true,
        },
    });

    return apiResponse(res, 200, true, "Coupon usages fetched successfully.", couponUsages);
});
