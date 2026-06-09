import prisma from "../config/prisma.js";
import { ApiError } from "../utils/error.js";

export const validateCoupon = async (couponCode, bookingId) => {
    const coupon = await prisma.coupon.findFirst({
        where: {
            code: couponCode?.toUpperCase(),
            deletedAt: null,
        },
    });

    if (!coupon) throw ApiError.notFound("Coupon not found.");

    if (!coupon.isActive) throw ApiError.badRequest("Coupon is not active.");

    if (coupon.startsAt && coupon.startsAt > new Date())
        throw ApiError.badRequest("Coupon is not active yet.");

    if (coupon.expiresAt && coupon.expiresAt < new Date())
        throw ApiError.badRequest("Coupon has expired.");

    const couponUsage = await prisma.couponUsage.findUnique({
        where: {
            couponId_bookingId: { couponId: coupon.id, bookingId },
        },
    });

    if (couponUsage) throw ApiError.badRequest("Coupon has been used already.");

    if (coupon.maxUses !== null) {
        const usageCount = await prisma.couponUsage.count({
            where: { couponId: coupon.id },
        });
        if (usageCount >= coupon.maxUses)
            throw ApiError.badRequest("Coupon has been used maximum times.");
    }

    const applyDiscount = (totalAmount) => {
        if (coupon.type === "PERCENTAGE") {
            const percentage = Math.min(100, Number(coupon.value));
            return Math.max(0, totalAmount - (totalAmount * percentage) / 100);
        }
        return Math.max(0, totalAmount - Number(coupon.value));
    };

    return applyDiscount;
};
