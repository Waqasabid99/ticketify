import prisma from "../config/prisma.js";
import { TicketStatus, BookingStatus, UserRole } from "../generated/prisma/enums.ts";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";

// ─── Shared include shape ────────────────────────────────────────────────────

export const ticketInclude = {
    booking: {
        select: {
            bookingNumber: true,
            movieTitle: true,
            cinemaName: true,
            screenName: true,
            showStartTime: true,
            status: true,
        },
    },
    bookingSeat: {
        select: {
            seatLabel: true,
            seatType: true,
            price: true,
        },
    },
};

// ─── Get My Tickets (customer) ───────────────────────────────────────────────

export const getMyTickets = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const { page = 1, limit = 20, status } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNumber - 1) * pageSize;

    const where = { booking: { userId } };

    if (status) {
        const allowed = Object.values(TicketStatus);
        if (!allowed.includes(status.toUpperCase()))
            throw ApiError.badRequest("Invalid ticket status filter.");
        where.status = status.toUpperCase();
    }

    const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
            where,
            include: ticketInclude,
            skip,
            take: pageSize,
            orderBy: { booking: { showStartTime: "desc" } },
        }),
        prisma.ticket.count({ where }),
    ]);

    return apiResponse(res, 200, true, "Tickets fetched successfully.", {
        tickets,
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
});

// ─── Get Ticket By ID ────────────────────────────────────────────────────────

export const getTicketById = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { id: requesterId, role } = req.user;

    if (!ticketId) throw ApiError.badRequest("Ticket ID is required.");

    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
            ...ticketInclude,
            booking: {
                select: {
                    ...ticketInclude.booking.select,
                    userId: true, // needed for ownership check, stripped before response
                },
            },
        },
    });

    if (!ticket) throw ApiError.notFound("Ticket not found.");

    const isCustomer = role === UserRole.CUSTOMER;
    if (isCustomer && ticket.booking.userId !== requesterId)
        throw ApiError.forbidden("Access denied.");

    // Strip internal userId before sending
    const { userId: _uid, ...bookingForResponse } = ticket.booking;
    return apiResponse(res, 200, true, "Ticket fetched successfully.", {
        ...ticket,
        booking: bookingForResponse,
    });
});

// ─── Get All Tickets (admin / staff) ────────────────────────────────────────

export const getAllTickets = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        bookingId,
        showId,
        orderBy = "desc",
    } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNumber - 1) * pageSize;

    const where = {};

    if (status) {
        const allowed = Object.values(TicketStatus);
        if (!allowed.includes(status.toUpperCase()))
            throw ApiError.badRequest("Invalid ticket status filter.");
        where.status = status.toUpperCase();
    }

    if (bookingId) where.bookingId = bookingId;

    if (showId) {
        where.booking = { showId };
    }

    const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
            where,
            include: {
                ...ticketInclude,
                booking: {
                    select: {
                        ...ticketInclude.booking.select,
                        userId: true,
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true },
                        },
                    },
                },
            },
            skip,
            take: pageSize,
            orderBy: { booking: { showStartTime: orderBy === "asc" ? "asc" : "desc" } },
        }),
        prisma.ticket.count({ where }),
    ]);

    return apiResponse(res, 200, true, "Tickets fetched successfully.", {
        tickets,
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
});

// ─── Verify Ticket (QR scan at gate) ────────────────────────────────────────

export const verifyTicket = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { id: scannedBy } = req.user;

    if (!token) throw ApiError.badRequest("QR token is required.");

    const ticket = await prisma.ticket.findFirst({
        where: { qrCode: token },
        include: {
            booking: {
                select: {
                    id: true,
                    bookingNumber: true,
                    movieTitle: true,
                    cinemaName: true,
                    screenName: true,
                    showStartTime: true,
                    status: true,
                },
            },
            bookingSeat: {
                select: { seatLabel: true, seatType: true },
            },
        },
    });

    if (!ticket) throw ApiError.notFound("Invalid QR code.");

    if (ticket.booking.status !== BookingStatus.CONFIRMED)
        throw ApiError.badRequest(
            `Booking is ${ticket.booking.status.toLowerCase()} — entry not permitted.`
        );

    if (ticket.status === TicketStatus.CANCELLED)
        throw ApiError.badRequest("This ticket has been cancelled.");

    if (ticket.status === TicketStatus.USED)
        throw ApiError.conflict(
            `Ticket already checked in at ${ticket.checkedInAt?.toISOString() ?? "unknown time"}.`
        );

    // Happy path — mark checked-in
    const validated = await prisma.$transaction(async (tx) => {
        const updated = await tx.ticket.update({
            where: { id: ticket.id },
            data: {
                status: TicketStatus.USED,
                checkedInAt: new Date(),
            },
            include: ticketInclude,
        });

        await tx.auditLog.create({
            data: {
                userId: scannedBy,
                action: "TICKET_VERIFIED",
                entity: "TICKET",
                entityId: ticket.id,
                metadata: {
                    ticketNumber: ticket.ticketNumber,
                    bookingId: ticket.bookingId,
                    seatLabel: ticket.bookingSeat.seatLabel,
                },
            },
        });

        return updated;
    });

    return apiResponse(res, 200, true, "Ticket verified. Entry granted.", validated);
});

// ─── Cancel Ticket (admin / staff only) ─────────────────────────────────────

export const cancelTicket = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { id: cancelledBy } = req.user;

    if (!ticketId) throw ApiError.badRequest("Ticket ID is required.");

    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
            booking: { select: { id: true, bookingNumber: true, status: true } },
            bookingSeat: { select: { seatLabel: true } },
        },
    });

    if (!ticket) throw ApiError.notFound("Ticket not found.");

    if (ticket.status === TicketStatus.CANCELLED)
        throw ApiError.badRequest("Ticket is already cancelled.");

    if (ticket.status === TicketStatus.USED)
        throw ApiError.badRequest(
            "Cannot cancel a ticket that has already been used for entry."
        );

    const cancelled = await prisma.$transaction(async (tx) => {
        const updated = await tx.ticket.update({
            where: { id: ticketId },
            data: { status: TicketStatus.CANCELLED },
            include: ticketInclude,
        });

        await tx.auditLog.create({
            data: {
                userId: cancelledBy,
                action: "TICKET_CANCELLED",
                entity: "TICKET",
                entityId: ticketId,
                metadata: {
                    ticketNumber: ticket.ticketNumber,
                    bookingId: ticket.bookingId,
                    seatLabel: ticket.bookingSeat.seatLabel,
                    bookingNumber: ticket.booking.bookingNumber,
                },
            },
        });

        return updated;
    });

    return apiResponse(res, 200, true, "Ticket cancelled successfully.", cancelled);
});
