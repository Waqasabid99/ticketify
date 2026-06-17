import prisma from "../config/prisma.js";
import { BookingStatus, BookingSource, ShowSeatStatus, TicketStatus, ShowStatus, CouponType, UserRole } from "../generated/prisma/enums.ts";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { generateBookingNumber, generateQrCode, generateTicketNumber } from "../utils/bookingHelper.js";
import { sendBookingConfirmationEmail } from "../services/email.service.js";
import { ticketInclude } from "./ticket.controller.js";

// ─── Create Booking ──────────────────────────────────────────────────────────

export const createBooking = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const { showId, seatIds, source = "WEB", couponCode } = req.body;

    // ── 1. Validate request ──────────────────────────────────────────────────
    if (!showId || !Array.isArray(seatIds) || seatIds.length === 0)
        throw ApiError.badRequest("Show ID and at least one seat ID are required.");

    const allowedSources = Object.values(BookingSource);
    if (!allowedSources.includes(source.toUpperCase()))
        throw ApiError.badRequest("Invalid booking source.");

    // ── 2. Verify show ───────────────────────────────────────────────────────
    const show = await prisma.show.findFirst({
        where: { id: showId, deletedAt: null },
        include: {
            movie: { select: { title: true, durationMinutes: true } },
            screen: {
                select: {
                    name: true,
                    cinema: { select: { name: true } },
                },
            },
            pricingRules: true,
        },
    });

    if (!show) throw ApiError.notFound("Show not found.");
    if (show.status !== ShowStatus.SCHEDULED)
        throw ApiError.badRequest("Show is not available for booking.");
    if (new Date(show.startTime) <= new Date())
        throw ApiError.badRequest("Show has already started.");

    // ── 3. Validate coupon (if supplied) ─────────────────────────────────────
    let couponMeta = null;

    if (couponCode) {
        const coupon = await prisma.coupon.findFirst({
            where: { code: couponCode.toUpperCase().trim(), deletedAt: null },
        });

        if (!coupon || !coupon.isActive)
            throw ApiError.badRequest("Coupon not found or inactive.");
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
            throw ApiError.badRequest("Coupon has expired.");
        if (coupon.startsAt && new Date(coupon.startsAt) > new Date())
            throw ApiError.badRequest("Coupon is not yet active.");
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
            throw ApiError.badRequest("Coupon usage limit has been reached.");

        // Check this user hasn't already used this coupon
        const alreadyUsed = await prisma.couponUsage.findFirst({
            where: { couponId: coupon.id, userId },
        });
        if (alreadyUsed) throw ApiError.conflict("You have already used this coupon.");

        // Build a discount function to apply later once we have a total
        const discountFn = (total) => {
            if (coupon.type === CouponType.FIXED) {
                return Math.max(0, total - Number(coupon.value));
            }
            // PERCENTAGE
            const discount = (total * Number(coupon.value)) / 100;
            return Math.max(0, total - discount);
        };

        couponMeta = { coupon, discountFn };
    }

    // ── 4. Start transaction ─────────────────────────────────────────────────
    const booking = await prisma.$transaction(async (tx) => {

        // ── 5. Atomically reserve seats WHERE status = AVAILABLE ─────────────
        const reservedUntil = new Date(Date.now() + 10 * 60 * 1000);

        await tx.$executeRaw`
        UPDATE "ShowSeat"
        SET    status            = 'RESERVED'::"ShowSeatStatus",
            "reservedUntil"  = ${reservedUntil}
        WHERE  "showId" = ${showId}
        AND  "seatId" = ANY(${seatIds}::text[])
        AND  status   = 'AVAILABLE'::"ShowSeatStatus"
    `;

        // ── 6. Verify all seats were reserved ────────────────────────────────
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
            // Some seats were taken by a concurrent request — roll back
            const reservedIds = new Set(reservedSeats.map((ss) => ss.seatId));
            const takenLabels = seatIds
                .filter((id) => !reservedIds.has(id))
                .map((id) => id); // IDs here; swap for labels if you join above

            throw ApiError.conflict(
                `One or more seats are no longer available. Please choose different seats.`
            );
        }

        // ── 7. Calculate prices ──────────────────────────────────────────────
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

        const discountAmount = couponMeta
            ? totalAmount - couponMeta.discountFn(totalAmount)
            : 0;
        const finalAmount = totalAmount - discountAmount;

        // ── 8. Create booking ────────────────────────────────────────────────
        const newBooking = await tx.booking.create({
            data: {
                bookingNumber: generateBookingNumber(),
                userId,
                showId,
                couponId: couponMeta?.coupon.id ?? null,
                totalAmount,
                discountAmount,
                finalAmount,
                status: BookingStatus.PENDING,
                source: source.toUpperCase(),
                expiresAt: reservedUntil,
                movieTitle: show.movie.title,
                screenName: show.screen.name,
                cinemaName: show.screen.cinema.name,
                showStartTime: show.startTime,
            },
        });

        // ── 9. Create booking seats ──────────────────────────────────────────
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

        // Link show seats to this booking
        await tx.showSeat.updateMany({
            where: { showId, seatId: { in: seatIds } },
            data: { bookingId: newBooking.id },
        });

        // ── 10. Create coupon usage (if any) ─────────────────────────────────
        if (couponMeta) {
            await tx.couponUsage.create({
                data: {
                    couponId: couponMeta.coupon.id,
                    bookingId: newBooking.id,
                    userId,
                },
            });

            await tx.coupon.update({
                where: { id: couponMeta.coupon.id },
                data: { usedCount: { increment: 1 } },
            });
        }

        // ── 11. Create audit log ─────────────────────────────────────────────
        await tx.auditLog.create({
            data: {
                userId,
                action: "BOOKING_CREATED",
                entity: "BOOKING",
                entityId: newBooking.id,
                metadata: {
                    showId,
                    seatIds,
                    totalAmount,
                    discountAmount,
                    finalAmount,
                    couponCode: couponMeta?.coupon.code ?? null,
                    ipAddress: req.ip,
                    userAgent: req.headers?.["user-agent"],
                },
            },
        });

        // ── 12. Commit ─────────────────
        return {
            ...newBooking,
            seats: seatPrices.map(({ seat, price }) => ({
                seatId: seat.id,
                seatLabel: `${seat.rowLabel}${seat.seatNumber}`,
                seatType: seat.seatType,
                price,
            })),
        };
    });

    return apiResponse(res, 201, true, "Booking created successfully.", booking);
});

// ─── Get All Bookings (admin) ────────────────────────────────────────────────

export const getAllBookings = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, userId: filterUserId, showId: filterShowId, orderBy = "desc" } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNumber - 1) * pageSize;

    const where = {};
    if (status) {
        const allowedStatuses = Object.values(BookingStatus);
        if (!allowedStatuses.includes(status.toUpperCase()))
            throw ApiError.badRequest("Invalid booking status filter.");
        where.status = status.toUpperCase();
    }
    if (filterUserId) where.userId = filterUserId;
    if (filterShowId) where.showId = filterShowId;

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
                seats: true,
                payments: { select: { status: true, amount: true, provider: true } },
            },
            skip,
            take: pageSize,
            orderBy: { createdAt: orderBy === "asc" ? "asc" : "desc" },
        }),
        prisma.booking.count({ where }),
    ]);

    return apiResponse(res, 200, true, "Bookings fetched successfully.", {
        bookings,
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
});

// ─── Get My Bookings (customer) ──────────────────────────────────────────────

export const getMyBookings = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const { page = 1, limit = 20, status } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNumber - 1) * pageSize;

    const where = { userId };
    if (status) {
        const allowedStatuses = Object.values(BookingStatus);
        if (!allowedStatuses.includes(status.toUpperCase()))
            throw ApiError.badRequest("Invalid booking status filter.");
        where.status = status.toUpperCase();
    }

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            include: {
                seats: true,
                tickets: { select: { ticketNumber: true, status: true, qrCode: true } },
                payments: { select: { status: true, amount: true, provider: true } },
            },
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
        }),
        prisma.booking.count({ where }),
    ]);

    return apiResponse(res, 200, true, "Bookings fetched successfully.", {
        bookings,
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
});

// ─── Get Booking By ID ───────────────────────────────────────────────────────

export const getBookingById = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { id: requesterId, role } = req.user;

    if (!bookingId) throw ApiError.badRequest("Booking ID is required.");

    const booking = await prisma.booking.findFirst({
        where: { id: bookingId },
        include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            seats: true,
            tickets: true,
            payments: true,
            coupon: { select: { code: true, type: true, value: true } },
        },
    });

    if (!booking) throw ApiError.notFound("Booking not found.");

    // Customers may only view their own bookings
    const isCustomer = role === "CUSTOMER";
    if (isCustomer && booking.userId !== requesterId)
        throw ApiError.forbidden("Access denied.");

    return apiResponse(res, 200, true, "Booking fetched successfully.", booking);
});

// ─── Get Tickets By Booking ──────────────────────────────────────────────────

export const getTicketsByBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { id: requesterId, role } = req.user;

    if (!bookingId) throw ApiError.badRequest("Booking ID is required.");

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { userId: true, status: true },
    });

    if (!booking) throw ApiError.notFound("Booking not found.");

    const isCustomer = role === UserRole.CUSTOMER;
    if (isCustomer && booking.userId !== requesterId)
        throw ApiError.forbidden("Access denied.");

    const tickets = await prisma.ticket.findMany({
        where: { bookingId },
        include: ticketInclude,
        orderBy: { bookingSeat: { seatLabel: "asc" } },
    });

    return apiResponse(res, 200, true, "Tickets fetched successfully.", { tickets });
});

// ─── Confirm Booking (after successful payment) ──────────────────────────────

export const confirmBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { id: userId, role } = req.user;

    if (!bookingId) throw ApiError.badRequest("Booking ID is required.");

    const booking = await prisma.booking.findFirst({
        where: { id: bookingId },
        include: {
            seats: true,
            user: {
                select: {
                    id: true,
                    firstName: true,
                    email: true
                }
            }
        },
    });

    if (!booking) throw ApiError.notFound("Booking not found.");

    const isCustomer = role === "CUSTOMER";
    if (isCustomer && booking.userId !== userId)
        throw ApiError.forbidden("Access denied.");

    if (booking.status === BookingStatus.CONFIRMED)
        throw ApiError.badRequest("Booking is already confirmed.");

    if (
        booking.status === BookingStatus.CANCELLED ||
        booking.status === BookingStatus.EXPIRED
    )
        throw ApiError.badRequest(`Cannot confirm a ${booking.status.toLowerCase()} booking.`);

    if (booking.expiresAt && new Date(booking.expiresAt) < new Date())
        throw ApiError.badRequest("Booking has expired.");

    const confirmed = await prisma.$transaction(async (tx) => {
        // Confirm the booking
        const updatedBooking = await tx.booking.update({
            where: { id: bookingId },
            data: {
                status: BookingStatus.CONFIRMED,
                bookedAt: new Date(),
            },
        });

        // Mark show seats as permanently BOOKED
        await tx.showSeat.updateMany({
            where: { bookingId },
            data: { status: ShowSeatStatus.BOOKED, reservedUntil: null },
        });

        let qrImage;
        // Issue one ticket per seat
        const ticketData = await Promise.all(
            booking.seats.map(async (bookingSeat) => {
                const { token, qrImage: currentQrImage } = await generateQrCode();
                qrImage = currentQrImage;

                return {
                    bookingSeatId: bookingSeat.id,
                    bookingId,
                    ticketNumber: generateTicketNumber(),
                    qrCode: token,
                    status: TicketStatus.ACTIVE,
                };
            })
        );

        await tx.ticket.createMany({ data: ticketData });

        // Fire-and-forget — do not await so we don't block the transaction
        sendBookingConfirmationEmail(booking, ticketData, qrImage);

        await tx.auditLog.create({
            data: {
                userId,
                action: "BOOKING_CONFIRMED",
                entity: "BOOKING",
                entityId: bookingId,
                metadata: {
                    ticketsIssued: ticketData.length,
                    ipAddress: req.ip,
                    userAgent: req.headers?.["user-agent"],
                },
            },
        });

        return tx.booking.findUnique({
            where: { id: bookingId },
            include: { seats: true, tickets: true },
        });
    });

    return apiResponse(res, 200, true, "Booking confirmed successfully.", confirmed);
});

// ─── Cancel Booking ──────────────────────────────────────────────────────────

export const cancelBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { id: userId, role } = req.user;

    if (!bookingId) throw ApiError.badRequest("Booking ID is required.");

    const booking = await prisma.booking.findFirst({
        where: { id: bookingId },
        include: { seats: true, tickets: true, couponUsages: true },
    });

    if (!booking) throw ApiError.notFound("Booking not found.");

    const isCustomer = role === "CUSTOMER";
    if (isCustomer && booking.userId !== userId)
        throw ApiError.forbidden("Access denied.");

    if (
        booking.status === BookingStatus.CANCELLED ||
        booking.status === BookingStatus.EXPIRED
    )
        throw ApiError.badRequest("Booking is already cancelled or expired.");

    if (booking.status === BookingStatus.CONFIRMED) {
        // Customers cannot self-cancel confirmed bookings (must go through refund flow)
        if (isCustomer)
            throw ApiError.badRequest(
                "Confirmed bookings cannot be cancelled directly. Please request a refund."
            );
    }

    const cancelled = await prisma.$transaction(async (tx) => {
        const updatedBooking = await tx.booking.update({
            where: { id: bookingId },
            data: { status: BookingStatus.CANCELLED },
        });

        // Release seats back to AVAILABLE
        await tx.showSeat.updateMany({
            where: { bookingId },
            data: {
                status: ShowSeatStatus.AVAILABLE,
                reservedUntil: null,
                bookingId: null,
            },
        });

        // Void any active tickets
        if (booking.tickets.length > 0) {
            await tx.ticket.updateMany({
                where: { bookingId },
                data: { status: TicketStatus.CANCELLED },
            });
        }

        // Remove coupon usage so coupon can be reused
        if (booking.couponUsages.length > 0) {
            await tx.couponUsage.deleteMany({ where: { bookingId } });
        }

        await tx.auditLog.create({
            data: {
                userId,
                action: "BOOKING_CANCELLED",
                entity: "BOOKING",
                entityId: bookingId,
                metadata: {
                    cancelledBy: userId,
                    previousStatus: booking.status,
                    ipAddress: req.ip,
                    userAgent: req.headers?.["user-agent"],
                },
            },
        });

        return updatedBooking;
    });

    return apiResponse(res, 200, true, "Booking cancelled successfully.", cancelled);
});

// ─── Expire Stale Bookings (cron / internal job) ─────────────────────────────

export const expireStaleBookings = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const stale = await prisma.booking.findMany({
        where: {
            status: { in: [BookingStatus.PENDING, BookingStatus.RESERVED, BookingStatus.EXPIRED] },
            expiresAt: { lt: new Date() },
        },
        include: { couponUsages: true },
    });

    if (stale.length === 0)
        return apiResponse(res, 200, true, "No stale bookings found.", { expired: 0 });

    const staleIds = stale.map((b) => b.id);
    const hasCoupons = stale.filter((b) => b.couponUsages.length > 0).map((b) => b.id);

    await prisma.$transaction(async (tx) => {
        await tx.booking.updateMany({
            where: { id: { in: staleIds } },
            data: { status: BookingStatus.EXPIRED },
        });

        await tx.showSeat.updateMany({
            where: { bookingId: { in: staleIds } },
            data: {
                status: ShowSeatStatus.AVAILABLE,
                reservedUntil: null,
                bookingId: null,
            },
        });

        if (hasCoupons.length > 0) {
            await tx.couponUsage.deleteMany({ where: { bookingId: { in: hasCoupons } } });
        }

        await tx.auditLog.createMany({
            data: staleIds.map((id) => ({
                userId,
                action: "BOOKING_EXPIRED",
                entity: "BOOKING",
                entityId: id,
                metadata: { expiredAt: new Date() },
            })),
        });
    });

    return apiResponse(res, 200, true, `${staleIds.length} booking(s) expired.`, {
        expired: staleIds.length,
        ids: staleIds,
    });
});

// ─── Get Show Seat Availability ───────────────────────────────────────────────

export const getShowSeatAvailability = asyncHandler(async (req, res) => {
    const { showId } = req.params;

    if (!showId) throw ApiError.badRequest("Show ID is required.");

    const show = await prisma.show.findFirst({
        where: { id: showId, deletedAt: null },
        select: { id: true, status: true, startTime: true },
    });

    if (!show) throw ApiError.notFound("Show not found.");

    const showSeats = await prisma.showSeat.findMany({
        where: { showId },
        include: {
            seat: {
                select: {
                    id: true,
                    rowLabel: true,
                    seatNumber: true,
                    seatType: true,
                },
            },
        },
        orderBy: [{ seat: { rowLabel: "asc" } }, { seat: { seatNumber: "asc" } }],
    });

    const summary = showSeats.reduce(
        (acc, ss) => {
            acc.total++;
            acc[ss.status] = (acc[ss.status] ?? 0) + 1;
            return acc;
        },
        { total: 0 }
    );

    return apiResponse(res, 200, true, "Seat availability fetched successfully.", {
        showId,
        showStatus: show.status,
        startTime: show.startTime,
        summary,
        seats: showSeats,
    });
});
