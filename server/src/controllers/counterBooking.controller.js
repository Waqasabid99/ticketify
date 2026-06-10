import crypto from "crypto";
import prisma from "../config/prisma.js";
import {
    BookingSource, BookingStatus, PaymentProvider, PaymentStatus,
    ShowSeatStatus, ShowStatus, TicketStatus, UserRole, UserStatus,
} from "../generated/prisma/enums.ts";
import { sendBookingConfirmationEmail } from "../services/email.service.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import {
    generateBookingNumber, generateQrCode, generateTicketNumber,
} from "../utils/bookingHelper.js";
import { ApiError } from "../utils/error.js";
import bcrypt from "bcrypt";

// ─── helpers ────────────────────────────────────────────────────────────────
async function resolveCustomer({ userId, guestName, guestEmail, guestPhone }) {

    // ── Path 1: existing user selected by staff ──────────────────────────────
    if (userId) {
        const customer = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            select: { id: true, firstName: true, lastName: true, email: true },
        });
        if (!customer) throw ApiError.notFound("Selected customer not found.");
        return { customer, accountCreated: false };
    }

    // ── name is required for all guest paths ────────────────────────────────
    if (!guestName?.trim())
        throw ApiError.badRequest("guestName is required when no userId is provided.");

    const [firstName, ...rest] = guestName.trim().split(/\s+/);
    const lastName = rest.join(" ") || null;

    // ── Path 2: email provided → upsert ─────────────────────────────────────
    if (guestEmail?.trim()) {
        const email = guestEmail.trim().toLowerCase();

        const existing = await prisma.user.findFirst({
            where: { email, deletedAt: null },
            select: { id: true, firstName: true, lastName: true, email: true },
        });

        if (existing) {
            return { customer: existing, accountCreated: false };
        }

        // Create a real account — staff collected a proper email
        // Temp password: random 12-char string, customer must reset via "forgot password"
        const tempPassword = crypto.randomBytes(8).toString("hex"); // 16 hex chars
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const created = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                phone: guestPhone?.trim() || null,
                passwordHash,
                role: UserRole.CUSTOMER,
                status: UserStatus.ACTIVE,
                emailVerified: false,
            },
            select: { id: true, firstName: true, lastName: true, email: true },
        });

        return { customer: created, accountCreated: true, tempEmail: email };
    }

    // ── Path 3: name only → anonymous guest placeholder ──────────────────────
    const guestId = crypto.randomUUID();
    const placeholderEmail = `guest_${guestId}@counter.local`;
    const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);

    const guest = await prisma.user.create({
        data: {
            firstName,
            lastName,
            email: placeholderEmail,
            phone: guestPhone?.trim() || null,
            passwordHash,
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
            emailVerified: false,
        },
        select: { id: true, firstName: true, lastName: true, email: true },
    });

    return { customer: guest, accountCreated: true, isAnonymousGuest: true };
}

// ─── controller ─────────────────────────────────────────────────────────────

export const createCounterBooking = asyncHandler(async (req, res) => {
    const { id: staffId } = req.user;
    const {
        // customer resolution (one of these groups is required)
        userId,
        guestName,
        guestEmail,
        guestPhone,

        // booking details
        showId,
        seatIds,
        couponCode,
        paymentProvider = "CASH",
        transactionId: externalTxId,
        notes,
    } = req.body;

    // ── Basic input validation ────────────────────────────────────────────────
    if (!showId || !Array.isArray(seatIds) || seatIds.length === 0)
        throw ApiError.badRequest("showId and at least one seatId are required.");

    if (!userId && !guestName?.trim())
        throw ApiError.badRequest("Provide either userId (existing customer) or guestName (walk-in).");

    const allowedProviders = [
        PaymentProvider.CASH,
        PaymentProvider.JAZZCASH,
        PaymentProvider.EASYPAISA,
    ];
    const provider = paymentProvider.toUpperCase();
    if (!allowedProviders.includes(provider))
        throw ApiError.badRequest(`Counter payments support: ${allowedProviders.join(", ")}.`);

    // ── Resolve customer (before the transaction — may do bcrypt hashing) ────
    const {
        customer,
        accountCreated,
        tempEmail,
        isAnonymousGuest = false,
    } = await resolveCustomer({ userId, guestName, guestEmail, guestPhone });

    // ── Verify show ───────────────────────────────────────────────────────────
    const show = await prisma.show.findFirst({
        where: { id: showId, deletedAt: null },
        include: {
            movie: { select: { title: true } },
            screen: { select: { name: true, cinema: { select: { name: true } } } },
            pricingRules: true,
        },
    });

    if (!show) throw ApiError.notFound("Show not found.");
    if (show.status !== ShowStatus.SCHEDULED)
        throw ApiError.badRequest("Show is not available for booking.");
    if (new Date(show.startTime) <= new Date())
        throw ApiError.badRequest("Show has already started.");

    // ── Optional coupon validation ────────────────────────────────────────────
    let couponMeta = null;
    if (couponCode) {
        const coupon = await prisma.coupon.findFirst({
            where: { code: couponCode.toUpperCase(), deletedAt: null },
        });
        if (!coupon || !coupon.isActive)
            throw ApiError.badRequest("Coupon not found or inactive.");
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
            throw ApiError.badRequest("Coupon has expired.");
        if (coupon.startsAt && new Date(coupon.startsAt) > new Date())
            throw ApiError.badRequest("Coupon is not yet active.");
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
            throw ApiError.badRequest("Coupon usage limit has been reached.");

        const alreadyUsed = await prisma.couponUsage.findFirst({
            where: { couponId: coupon.id, userId: customer.id },
        });
        if (alreadyUsed) throw ApiError.conflict("Customer has already used this coupon.");

        couponMeta = {
            coupon,
            discountFn: (total) => {
                if (coupon.type === "FIXED") return Math.max(0, total - Number(coupon.value));
                const discount = (total * Number(coupon.value)) / 100;
                return Math.max(0, total - discount);
            },
        };
    }

    // ── Everything in one transaction ─────────────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {

        // Atomically reserve seats
        const reservedUntil = new Date(Date.now() + 5 * 60 * 1000);
        await tx.$executeRaw`
            UPDATE "ShowSeat"
            SET    status           = 'RESERVED'::"ShowSeatStatus",
                   "reservedUntil" = ${reservedUntil}
            WHERE  "showId" = ${showId}
            AND    "seatId" = ANY(${seatIds}::text[])
            AND    status   = 'AVAILABLE'::"ShowSeatStatus"
        `;

        const reservedSeats = await tx.showSeat.findMany({
            where: {
                showId,
                seatId: { in: seatIds },
                status: ShowSeatStatus.RESERVED,
                reservedUntil,
            },
            include: { seat: true },
        });

        if (reservedSeats.length !== seatIds.length) {
            throw ApiError.conflict(
                "One or more seats are no longer available. Please choose different seats."
            );
        }

        // Pricing
        const getPriceForSeat = (seat) => {
            const rule =
                show.pricingRules.find((r) => r.seatType === seat.seatType) ??
                show.pricingRules.find((r) => r.seatType === null);
            if (!rule)
                throw ApiError.badRequest(`No pricing rule found for seat type: ${seat.seatType}`);
            return Number(rule.amount);
        };

        const seatPrices = reservedSeats.map((ss) => ({
            seat: ss.seat,
            price: getPriceForSeat(ss.seat),
        }));

        const totalAmount = seatPrices.reduce((sum, { price }) => sum + price, 0);
        const discountAmount = couponMeta ? totalAmount - couponMeta.discountFn(totalAmount) : 0;
        const finalAmount = totalAmount - discountAmount;

        // Create booking — straight to CONFIRMED, skip PENDING entirely
        const newBooking = await tx.booking.create({
            data: {
                bookingNumber: generateBookingNumber(),
                userId: customer.id,
                showId,
                couponId: couponMeta?.coupon.id ?? null,
                totalAmount,
                discountAmount,
                finalAmount,
                status: BookingStatus.CONFIRMED,
                source: BookingSource.COUNTER,
                bookedAt: new Date(),
                expiresAt: null,
                movieTitle: show.movie.title,
                screenName: show.screen.name,
                cinemaName: show.screen.cinema.name,
                showStartTime: show.startTime,
            },
        });

        // Booking seats
        await tx.bookingSeat.createMany({
            data: seatPrices.map(({ seat, price }) => ({
                bookingId: newBooking.id,
                showId,
                seatId: seat.id,
                seatLabel: `${seat.rowLabel}${seat.seatNumber}`,
                seatType: seat.seatType,
                price,
            })),
        });

        // Lock show seats permanently
        await tx.showSeat.updateMany({
            where: { showId, seatId: { in: seatIds } },
            data: {
                status: ShowSeatStatus.BOOKED,
                reservedUntil: null,
                bookingId: newBooking.id,
            },
        });

        // Coupon usage
        if (couponMeta) {
            await tx.couponUsage.create({
                data: { couponId: couponMeta.coupon.id, bookingId: newBooking.id, userId: customer.id },
            });
            await tx.coupon.update({
                where: { id: couponMeta.coupon.id },
                data: { usedCount: { increment: 1 } },
            });
        }

        // Payment — already collected at counter
        const payment = await tx.payment.create({
            data: {
                bookingId: newBooking.id,
                provider,
                transactionId: externalTxId ?? null,
                amount: finalAmount,
                status: PaymentStatus.SUCCESS,
                paidAt: new Date(),
                gatewayResponse: {
                    method: "counter",
                    collectedBy: staffId,
                    notes: notes ?? null,
                    externalTransactionId: externalTxId ?? null,
                },
            },
        });

        // Issue tickets
        const bookingSeats = await tx.bookingSeat.findMany({
            where: { bookingId: newBooking.id },
        });

        let lastQrImage;
        const ticketData = await Promise.all(
            bookingSeats.map(async (bs) => {
                const { token, qrImage } = await generateQrCode();
                lastQrImage = qrImage;
                return {
                    bookingSeatId: bs.id,
                    bookingId: newBooking.id,
                    ticketNumber: generateTicketNumber(),
                    qrCode: token,
                    status: TicketStatus.ACTIVE,
                };
            })
        );

        await tx.ticket.createMany({ data: ticketData });

        // Non-blocking email (skip anonymous guests — no real inbox)
        if (!isAnonymousGuest) {
            sendBookingConfirmationEmail(
                { ...newBooking, user: customer },
                ticketData,
                lastQrImage
            ).catch(() => { });
        }

        // Audit
        await tx.auditLog.create({
            data: {
                userId: staffId,
                action: "COUNTER_BOOKING_CREATED",
                entity: "BOOKING",
                entityId: newBooking.id,
                metadata: {
                    customerId: customer.id,
                    customerName: `${customer.firstName} ${customer.lastName ?? ""}`.trim(),
                    accountCreated,
                    isAnonymousGuest,
                    seatIds,
                    totalAmount,
                    discountAmount,
                    finalAmount,
                    paymentProvider: provider,
                    externalTxId: externalTxId ?? null,
                    notes: notes ?? null,
                    couponCode: couponMeta?.coupon.code ?? null,
                    ipAddress: req.ip,
                    userAgent: req.headers?.["user-agent"],
                },
            },
        });

        return {
            booking: {
                ...newBooking,
                seats: seatPrices.map(({ seat, price }) => ({
                    seatId: seat.id,
                    seatLabel: `${seat.rowLabel}${seat.seatNumber}`,
                    seatType: seat.seatType,
                    price,
                })),
                tickets: ticketData,
            },
            payment,
            customer: {
                id: customer.id,
                name: `${customer.firstName} ${customer.lastName ?? ""}`.trim(),
                email: isAnonymousGuest ? null : customer.email,
            },
            // Frontend can use these flags:
            // accountCreated: true → optionally offer "send login link" button
            // isAnonymousGuest: true → no email, don't show email field in receipt
            accountCreated,
            isAnonymousGuest,
        };
    });

    return apiResponse(res, 201, true, "Counter booking created and confirmed.", result);
});
