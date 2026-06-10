import Stripe from "stripe";
import prisma from "../config/prisma.js";
import {
    PaymentStatus,
    PaymentProvider,
    BookingStatus,
    BookingSource,
    ShowSeatStatus,
    TicketStatus,
    SeatType,
    ShowStatus,
} from "../generated/prisma/enums.ts";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import {
    generateBookingNumber,
    generateQrCode,
    generateTicketNumber,
} from "../utils/bookingHelper.js";
import { sendBookingConfirmationEmail } from "../services/email.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2022-08-01",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getPaymentCurrency() {
    const setting = await prisma.setting.findUnique({
        where: { key: "payment_currency" },
    });
    return (setting?.value ?? "usd").toString().toLowerCase();
}

async function confirmBookingInTx(tx, { booking, triggeredByUserId, ipAddress, userAgent }) {
    await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CONFIRMED, bookedAt: new Date() },
    });

    await tx.showSeat.updateMany({
        where: { bookingId: booking.id },
        data: { status: ShowSeatStatus.BOOKED, reservedUntil: null },
    });

    // Fetch seats if not already included
    const seats =
        booking.seats ??
        (await tx.bookingSeat.findMany({ where: { bookingId: booking.id } }));

    let lastQrImage;
    const ticketData = await Promise.all(
        seats.map(async (bookingSeat) => {
            const { token, qrImage } = await generateQrCode();
            lastQrImage = qrImage;
            return {
                bookingSeatId: bookingSeat.id,
                bookingId: booking.id,
                ticketNumber: generateTicketNumber(),
                qrCode: token,
                status: TicketStatus.ACTIVE,
            };
        })
    );

    await tx.ticket.createMany({ data: ticketData });

    // Fire-and-forget — keep transaction lean
    sendBookingConfirmationEmail(booking, ticketData, lastQrImage).catch(() => { });

    await tx.auditLog.create({
        data: {
            userId: triggeredByUserId,
            action: "BOOKING_CONFIRMED",
            entity: "BOOKING",
            entityId: booking.id,
            metadata: {
                ticketsIssued: ticketData.length,
                trigger: triggeredByUserId === "SYSTEM" ? "stripe_webhook" : "counter_cash",
                ipAddress: ipAddress ?? null,
                userAgent: userAgent ?? null,
            },
        },
    });
}

// ─── 1. Create Payment Intent (online flow) ───────────────────────────────────

export const createPaymentIntent = asyncHandler(async (req, res) => {
    const { bookingId } = req.body;
    const { id: userId } = req.user;

    if (!bookingId) throw ApiError.badRequest("Booking ID is required.");

    // ── Load booking ──────────────────────────────────────────────────────────
    const booking = await prisma.booking.findFirst({
        where: { id: bookingId },
        include: { seats: true },
    });

    if (!booking) throw ApiError.notFound("Booking not found.");
    if (booking.userId !== userId) throw ApiError.forbidden("Access denied.");

    if (booking.status === BookingStatus.CONFIRMED)
        throw ApiError.badRequest("Booking is already confirmed.");
    if (booking.status === BookingStatus.CANCELLED)
        throw ApiError.badRequest("Cannot pay for a cancelled booking.");
    if (booking.status === BookingStatus.EXPIRED)
        throw ApiError.badRequest("Booking has expired. Please start again.");

    if (booking.expiresAt && new Date(booking.expiresAt) < new Date())
        throw ApiError.badRequest("Booking window has expired. Please start again.");

    // ── Guard: one active payment intent at a time ────────────────────────────
    // Allow creating a new intent only if no PENDING payment exists already.
    // (User can retry after a FAILED attempt — new row is created each time.)
    const pendingPayment = await prisma.payment.findFirst({
        where: { bookingId, status: PaymentStatus.PENDING },
    });
    if (pendingPayment) {
        // Return the existing intent so the frontend can re-use it
        // (e.g. page refresh mid-checkout)
        return apiResponse(res, 200, true, "Existing payment intent returned.", {
            clientSecret: pendingPayment.gatewayResponse?.clientSecret ?? null,
            paymentId: pendingPayment.id,
        });
    }

    const currency = await getPaymentCurrency();

    // Stripe expects amounts in the smallest currency unit (cents for USD)
    const amountInCents = Math.round(Number(booking.finalAmount) * 100);

    // ── Create Stripe PaymentIntent ───────────────────────────────────────────
    const intent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency,
        metadata: {
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            userId,
        },
        description: `Ticketify — ${booking.movieTitle} @ ${booking.cinemaName}`,
        // Attach customer email for Stripe dashboard visibility
        receipt_email: req.user.email ?? undefined,
    });

    // ── Persist payment record ────────────────────────────────────────────────
    const payment = await prisma.$transaction(async (tx) => {
        const newPayment = await tx.payment.create({
            data: {
                bookingId,
                provider: PaymentProvider.STRIPE,
                transactionId: intent.id,
                amount: booking.finalAmount,
                status: PaymentStatus.PENDING,
                gatewayResponse: {
                    clientSecret: intent.client_secret,
                    intentId: intent.id,
                    currency: intent.currency,
                    amountInCents: intent.amount,
                },
            },
        });

        // Protect booking from expiry cron while Stripe is in flight
        await tx.booking.update({
            where: { id: bookingId },
            data: { status: BookingStatus.RESERVED },
        });

        await tx.auditLog.create({
            data: {
                userId,
                action: "PAYMENT_INTENT_CREATED",
                entity: "PAYMENT",
                entityId: newPayment.id,
                metadata: {
                    intentId: intent.id,
                    amount: booking.finalAmount,
                    currency,
                    ipAddress: req.ip,
                    userAgent: req.headers?.["user-agent"],
                },
            },
        });

        return newPayment;
    });

    return apiResponse(res, 201, true, "Payment intent created.", {
        clientSecret: intent.client_secret,
        paymentId: payment.id,
        amount: booking.finalAmount,
        currency,
    });
});

// ─── 2. Stripe Webhook ────────────────────────────────────────────────────────
export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,                              // must be raw Buffer
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("[Webhook] Signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {

            // ── Payment succeeded ─────────────────────────────────────────────
            case "payment_intent.succeeded": {
                const intent = event.data.object;
                await handlePaymentSuccess(intent);
                break;
            }

            // ── Payment failed ────────────────────────────────────────────────
            case "payment_intent.payment_failed": {
                const intent = event.data.object;
                await handlePaymentFailure(intent);
                break;
            }

            // ── Payment cancelled ─────────────────────────────────────────────
            case "payment_intent.canceled": {
                const intent = event.data.object;
                await handlePaymentCancelled(intent);
                break;
            }

            default:
                // Acknowledge unhandled events — Stripe will stop retrying
                break;
        }

        // Always return 200 quickly so Stripe marks delivery as successful.
        // Any internal errors are caught below and still return 200 to avoid
        // Stripe re-delivering the same event endlessly.
        return res.status(200).json({ received: true });

    } catch (err) {
        // Log the error but still acknowledge receipt to Stripe.
        // Dead-letter / alerting should be handled externally (e.g. Sentry).
        console.error(`[Webhook] Error processing event ${event.type}:`, err);
        return res.status(200).json({ received: true, warning: "Processing error logged." });
    }
};

// ── Webhook sub-handlers ──────────────────────────────────────────────────────

async function handlePaymentSuccess(intent) {
    const { bookingId } = intent.metadata ?? {};
    if (!bookingId) {
        console.warn("[Webhook] payment_intent.succeeded missing bookingId metadata:", intent.id);
        return;
    }

    // Idempotency — if this webhook fires twice, skip silently
    const existing = await prisma.payment.findFirst({
        where: { transactionId: intent.id, status: PaymentStatus.SUCCESS },
    });
    if (existing) return;

    const booking = await prisma.booking.findFirst({
        where: { id: bookingId },
        include: { seats: true, user: { select: { id: true, firstName: true, email: true } } },
    });

    if (!booking) {
        console.error("[Webhook] Booking not found for intent:", intent.id);
        return;
    }

    // Already confirmed (double-delivery guard)
    if (booking.status === BookingStatus.CONFIRMED) return;

    await prisma.$transaction(async (tx) => {
        // Mark payment SUCCESS
        await tx.payment.updateMany({
            where: { bookingId, transactionId: intent.id },
            data: {
                status: PaymentStatus.SUCCESS,
                paidAt: new Date(),
                gatewayResponse: {
                    intentId: intent.id,
                    currency: intent.currency,
                    amountReceived: intent.amount_received,
                    paymentMethod: intent.payment_method,
                },
            },
        });

        await confirmBookingInTx(tx, {
            booking,
            triggeredByUserId: "SYSTEM",
            ipAddress: null,
            userAgent: null,
        });
    });

    console.info(`[Webhook] Booking ${bookingId} confirmed via Stripe.`);
}

async function handlePaymentFailure(intent) {
    const { bookingId } = intent.metadata ?? {};
    if (!bookingId) return;

    const failureReason =
        intent.last_payment_error?.message ?? "Payment failed — no reason provided.";

    await prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
            where: { bookingId, transactionId: intent.id, status: PaymentStatus.PENDING },
            data: {
                status: PaymentStatus.FAILED,
                failureReason,
                gatewayResponse: {
                    intentId: intent.id,
                    errorCode: intent.last_payment_error?.code ?? null,
                    errorMessage: failureReason,
                },
            },
        });

        // Revert booking back to PENDING so the user can retry
        await tx.booking.updateMany({
            where: { id: bookingId, status: BookingStatus.RESERVED },
            data: { status: BookingStatus.PENDING },
        });

        await tx.auditLog.create({
            data: {
                userId: "SYSTEM",
                action: "PAYMENT_FAILED",
                entity: "PAYMENT",
                entityId: bookingId,
                metadata: { intentId: intent.id, failureReason },
            },
        });
    });

    console.warn(`[Webhook] Payment failed for booking ${bookingId}: ${failureReason}`);
}

async function handlePaymentCancelled(intent) {
    const { bookingId } = intent.metadata ?? {};
    if (!bookingId) return;

    await prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
            where: { bookingId, transactionId: intent.id },
            data: {
                status: PaymentStatus.FAILED,
                failureReason: "Payment intent cancelled.",
            },
        });

        await tx.booking.updateMany({
            where: { id: bookingId, status: { in: [BookingStatus.PENDING, BookingStatus.RESERVED] } },
            data: { status: BookingStatus.PENDING },
        });
    });
}

// ─── 4. Get Payment By ID ─────────────────────────────────────────────────────
export const getPaymentById = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const { id: requesterId, role } = req.user;

    if (!paymentId) throw ApiError.badRequest("Payment ID is required.");

    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            booking: {
                select: {
                    id: true,
                    bookingNumber: true,
                    userId: true,
                    movieTitle: true,
                    cinemaName: true,
                    screenName: true,
                    showStartTime: true,
                    status: true,
                    finalAmount: true,
                },
            },
            refunds: true,
        },
    });

    if (!payment) throw ApiError.notFound("Payment not found.");

    const isCustomer = role === "CUSTOMER";
    if (isCustomer && payment.booking.userId !== requesterId)
        throw ApiError.forbidden("Access denied.");

    // Strip internal userId before returning to customers
    const { userId: _uid, ...bookingPublic } = payment.booking;
    return apiResponse(res, 200, true, "Payment fetched successfully.", {
        ...payment,
        booking: isCustomer ? bookingPublic : payment.booking,
    });
});

// ─── 5. Get Payments For a Booking ───────────────────────────────────────────
export const getPaymentsByBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { id: requesterId, role } = req.user;

    if (!bookingId) throw ApiError.badRequest("Booking ID is required.");

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { userId: true },
    });

    if (!booking) throw ApiError.notFound("Booking not found.");

    const isCustomer = role === "CUSTOMER";
    if (isCustomer && booking.userId !== requesterId)
        throw ApiError.forbidden("Access denied.");

    const payments = await prisma.payment.findMany({
        where: { bookingId },
        include: { refunds: true },
        orderBy: { createdAt: "desc" },
    });

    return apiResponse(res, 200, true, "Payments fetched successfully.", { payments });
});

// ─── 6. Get All Payments (admin / staff) ─────────────────────────────────────
export const getAllPayments = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        provider,
        bookingId,
        orderBy = "desc",
    } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNumber - 1) * pageSize;

    const where = {};

    if (status) {
        if (!Object.values(PaymentStatus).includes(status.toUpperCase()))
            throw ApiError.badRequest("Invalid payment status filter.");
        where.status = status.toUpperCase();
    }

    if (provider) {
        if (!Object.values(PaymentProvider).includes(provider.toUpperCase()))
            throw ApiError.badRequest("Invalid payment provider filter.");
        where.provider = provider.toUpperCase();
    }

    if (bookingId) where.bookingId = bookingId;

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where,
            include: {
                booking: {
                    select: {
                        bookingNumber: true,
                        movieTitle: true,
                        cinemaName: true,
                        userId: true,
                    },
                },
                refunds: { select: { id: true, amount: true, status: true } },
            },
            skip,
            take: pageSize,
            orderBy: { createdAt: orderBy === "asc" ? "asc" : "desc" },
        }),
        prisma.payment.count({ where }),
    ]);

    return apiResponse(res, 200, true, "Payments fetched successfully.", {
        payments,
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
});

// ─── 7. Retry Failed Payment ──────────────────────────────────────────────────
export const retryPayment = asyncHandler(async (req, res) => {
    const { bookingId } = req.body;
    const { id: userId } = req.user;

    if (!bookingId) throw ApiError.badRequest("Booking ID is required.");

    const booking = await prisma.booking.findFirst({
        where: { id: bookingId },
        include: { seats: true },
    });

    if (!booking) throw ApiError.notFound("Booking not found.");
    if (booking.userId !== userId) throw ApiError.forbidden("Access denied.");

    if (booking.status === BookingStatus.CONFIRMED)
        throw ApiError.badRequest("Booking is already confirmed.");
    if (booking.status === BookingStatus.CANCELLED)
        throw ApiError.badRequest("Cannot retry a cancelled booking.");
    if (booking.status === BookingStatus.EXPIRED)
        throw ApiError.badRequest("Booking has expired. Please create a new one.");

    // Ensure previous attempt actually failed — prevent duplicate intents
    const lastPayment = await prisma.payment.findFirst({
        where: { bookingId, provider: PaymentProvider.STRIPE },
        orderBy: { createdAt: "desc" },
    });

    if (lastPayment?.status === PaymentStatus.PENDING)
        throw ApiError.badRequest(
            "A payment is already in progress. Complete or wait for it to fail before retrying."
        );

    if (lastPayment?.status === PaymentStatus.SUCCESS)
        throw ApiError.badRequest("Payment already succeeded for this booking.");

    // Extend expiry window to give user time to re-enter card details
    const newExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const currency = await getPaymentCurrency();
    const amountInCents = Math.round(Number(booking.finalAmount) * 100);

    const intent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency,
        metadata: {
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            userId,
            retryAttempt: (lastPayment ? "true" : "false"),
        },
        description: `Ticketify (retry) — ${booking.movieTitle} @ ${booking.cinemaName}`,
        receipt_email: req.user.email ?? undefined,
    });

    const payment = await prisma.$transaction(async (tx) => {
        const newPayment = await tx.payment.create({
            data: {
                bookingId,
                provider: PaymentProvider.STRIPE,
                transactionId: intent.id,
                amount: booking.finalAmount,
                status: PaymentStatus.PENDING,
                gatewayResponse: {
                    clientSecret: intent.client_secret,
                    intentId: intent.id,
                    currency: intent.currency,
                    amountInCents: intent.amount,
                    isRetry: true,
                },
            },
        });

        // Extend expiry and bump to RESERVED again
        await tx.booking.update({
            where: { id: bookingId },
            data: {
                status: BookingStatus.RESERVED,
                expiresAt: newExpiry,
            },
        });

        await tx.auditLog.create({
            data: {
                userId,
                action: "PAYMENT_RETRIED",
                entity: "PAYMENT",
                entityId: newPayment.id,
                metadata: {
                    intentId: intent.id,
                    previousPaymentId: lastPayment?.id ?? null,
                    currency,
                    ipAddress: req.ip,
                    userAgent: req.headers?.["user-agent"],
                },
            },
        });

        return newPayment;
    });

    return apiResponse(res, 201, true, "New payment intent created for retry.", {
        clientSecret: intent.client_secret,
        paymentId: payment.id,
        amount: booking.finalAmount,
        currency,
        expiresAt: newExpiry,
    });
});

// ─── 8. Get Payment Summary / Stats (admin) ───────────────────────────────────
export const getPaymentStats = asyncHandler(async (req, res) => {
    const { from, to } = req.query;

    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const where = {
        status: PaymentStatus.SUCCESS,
        ...(Object.keys(dateFilter).length > 0 && { paidAt: dateFilter }),
    };

    const [
        totalRevenue,
        countByProvider,
        countByStatus,
        recentPayments,
    ] = await Promise.all([
        // Sum of all successful payments
        prisma.payment.aggregate({
            where,
            _sum: { amount: true },
            _count: { id: true },
        }),

        // Breakdown by provider
        prisma.payment.groupBy({
            by: ["provider"],
            where,
            _sum: { amount: true },
            _count: { id: true },
        }),

        // Count by status (all time or filtered)
        prisma.payment.groupBy({
            by: ["status"],
            _count: { id: true },
        }),

        // Last 5 successful payments
        prisma.payment.findMany({
            where,
            include: {
                booking: {
                    select: { bookingNumber: true, movieTitle: true, cinemaName: true },
                },
            },
            orderBy: { paidAt: "desc" },
            take: 5,
        }),
    ]);

    return apiResponse(res, 200, true, "Payment stats fetched successfully.", {
        totalRevenue: Number(totalRevenue._sum.amount ?? 0),
        totalTransactions: totalRevenue._count.id,
        byProvider: countByProvider.map((p) => ({
            provider: p.provider,
            total: Number(p._sum.amount ?? 0),
            count: p._count.id,
        })),
        byStatus: countByStatus.map((s) => ({
            status: s.status,
            count: s._count.id,
        })),
        recentSuccessful: recentPayments,
        period: {
            from: from ?? null,
            to: to ?? null,
        },
    });
});
