import prisma from "../config/prisma.js";
import { SeatStatus, SeatType, ShowSeatStatus } from "../generated/prisma/enums.ts";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";

export const getScreenSeats = asyncHandler(async (req, res) => {
    const { screenId } = req.params;
    const { seatType, status, rowLabel, page = 1, limit = 100 } = req.query;

    if (!screenId) throw ApiError.badRequest("Screen ID is required");

    const screen = await prisma.screen.findFirst({
        where: { id: screenId, deletedAt: null },
    });

    if (!screen) throw ApiError.notFound("Screen not found");

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(limit) || 100));
    const skip = (pageNumber - 1) * pageSize;

    const where = { screenId, deletedAt: null };

    if (seatType) {
        const sSeatType = seatType.toUpperCase();
        if (!Object.values(SeatType).includes(sSeatType))
            throw ApiError.badRequest("Invalid seat type");
        where.seatType = sSeatType;
    }

    if (status) {
        const sStatus = status.toUpperCase();
        if (!Object.values(SeatStatus).includes(sStatus))
            throw ApiError.badRequest("Invalid seat status");
        where.status = sStatus;
    }

    if (rowLabel) {
        where.rowLabel = rowLabel.toUpperCase();
    }

    const [seats, total] = await Promise.all([
        prisma.seat.findMany({
            where,
            include: {
                showSeats: {
                    select: {
                        show: {
                            select: {
                                pricingRules: true
                            }
                        }
                    }
                }
            },
            skip,
            take: pageSize,
            orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
        }),
        prisma.seat.count({ where }),
    ]);

    return apiResponse(res, 200, true, "Seats fetched successfully", {
        seats,
        seatType: Object.values(SeatType),
        status: Object.values(SeatStatus),
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
});

export const getSeatById = asyncHandler(async (req, res) => {
    const { seatId } = req.params;

    if (!seatId) throw ApiError.badRequest("Seat ID is required");

    const seat = await prisma.seat.findFirst({
        where: { id: seatId, deletedAt: null },
        include: {
            screen: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                    cinema: {
                        select: { id: true, name: true, city: true },
                    },
                },
            },
        },
    });

    if (!seat) throw ApiError.notFound("Seat not found");

    return apiResponse(res, 200, true, "Seat fetched successfully", seat);
});

export const updateSeat = asyncHandler(async (req, res) => {
    const { seatId } = req.params;
    const { seatType, rowLabel, seatNumber } = req.body;

    if (!seatId) throw ApiError.badRequest("Seat ID is required");

    const existingSeat = await prisma.seat.findFirst({
        where: { id: seatId, deletedAt: null },
    });

    if (!existingSeat) throw ApiError.notFound("Seat not found");

    // Block updates if seat is actively reserved or booked in any show
    const activeShowSeat = await prisma.showSeat.findFirst({
        where: {
            seatId,
            status: { in: [ShowSeatStatus.RESERVED, ShowSeatStatus.BOOKED] },
        },
    });

    if (activeShowSeat)
        throw ApiError.badRequest(
            "Seat is currently reserved or booked in an active show and cannot be modified"
        );

    const updateData = {};

    if (seatType) {
        const sSeatType = seatType.toUpperCase();
        if (!Object.values(SeatType).includes(sSeatType))
            throw ApiError.badRequest("Invalid seat type");
        updateData.seatType = sSeatType;
    }

    if (rowLabel) {
        updateData.rowLabel = rowLabel.toUpperCase();
    }

    if (seatNumber !== undefined) {
        const num = Number(seatNumber);
        if (!Number.isInteger(num) || num <= 0)
            throw ApiError.badRequest("seatNumber must be a positive integer");
        updateData.seatNumber = num;
    }

    if (Object.keys(updateData).length === 0)
        throw ApiError.badRequest("No fields provided for update");

    // Enforce uniqueness of (screenId, rowLabel, seatNumber)
    const duplicate = await prisma.seat.findFirst({
        where: {
            screenId: existingSeat.screenId,
            rowLabel: updateData.rowLabel ?? existingSeat.rowLabel,
            seatNumber: updateData.seatNumber ?? existingSeat.seatNumber,
            id: { not: seatId },
            deletedAt: null,
        },
    });

    if (duplicate)
        throw ApiError.conflict(
            `Seat ${updateData.rowLabel ?? existingSeat.rowLabel}${updateData.seatNumber ?? existingSeat.seatNumber} already exists in this screen`
        );

    const updatedSeat = await prisma.seat.update({
        where: { id: seatId },
        data: updateData,
    });

    return apiResponse(res, 200, true, "Seat updated successfully", updatedSeat);
});

export const updateSeatStatus = asyncHandler(async (req, res) => {
    const { seatId } = req.params;
    const { status } = req.body;

    if (!seatId) throw ApiError.badRequest("Seat ID is required");

    const sStatus = status?.toUpperCase();
    if (!sStatus || !Object.values(SeatStatus).includes(sStatus))
        throw ApiError.badRequest("Valid status is required (AVAILABLE, BLOCKED, MAINTENANCE)");

    const existingSeat = await prisma.seat.findFirst({
        where: { id: seatId, deletedAt: null },
    });

    if (!existingSeat) throw ApiError.notFound("Seat not found");

    if (existingSeat.status === sStatus)
        throw ApiError.badRequest(`Seat is already ${sStatus}`);

    // Prevent blocking/maintenance if seat is live in a show
    if (sStatus !== SeatStatus.AVAILABLE) {
        const activeShowSeat = await prisma.showSeat.findFirst({
            where: {
                seatId,
                status: { in: [ShowSeatStatus.RESERVED, ShowSeatStatus.BOOKED] },
            },
        });

        if (activeShowSeat)
            throw ApiError.badRequest(
                "Seat is currently reserved or booked in an active show"
            );
    }

    const updatedSeat = await prisma.seat.update({
        where: { id: seatId },
        data: { status: sStatus },
    });

    return apiResponse(res, 200, true, "Seat status updated successfully", updatedSeat);
});

export const bulkUpdateSeatStatus = asyncHandler(async (req, res) => {
    const { screenId } = req.params;
    const { seatIds, status } = req.body;

    if (!screenId) throw ApiError.badRequest("Screen ID is required");

    if (!Array.isArray(seatIds) || seatIds.length === 0)
        throw ApiError.badRequest("seatIds must be a non-empty array");

    if (seatIds.length > 200)
        throw ApiError.badRequest("Cannot update more than 200 seats at once");

    const sStatus = status?.toUpperCase();
    if (!sStatus || !Object.values(SeatStatus).includes(sStatus))
        throw ApiError.badRequest("Valid status is required (AVAILABLE, BLOCKED, MAINTENANCE)");

    const screen = await prisma.screen.findFirst({
        where: { id: screenId, deletedAt: null },
    });

    if (!screen) throw ApiError.notFound("Screen not found");

    // Verify all seatIds belong to this screen and are not soft-deleted
    const seats = await prisma.seat.findMany({
        where: {
            id: { in: seatIds },
            screenId,
            deletedAt: null,
        },
        select: { id: true },
    });

    if (seats.length !== seatIds.length) {
        const foundIds = new Set(seats.map((s) => s.id));
        const invalid = seatIds.filter((id) => !foundIds.has(id));
        throw ApiError.badRequest(
            `The following seat IDs are invalid or don't belong to this screen: ${invalid.join(", ")}`
        );
    }

    // If moving away from AVAILABLE, block if any seat is actively in use
    if (sStatus !== SeatStatus.AVAILABLE) {
        const activeShowSeats = await prisma.showSeat.findMany({
            where: {
                seatId: { in: seatIds },
                status: { in: [ShowSeatStatus.RESERVED, ShowSeatStatus.BOOKED] },
            },
            select: { seatId: true },
        });

        if (activeShowSeats.length > 0) {
            const blockedIds = [...new Set(activeShowSeats.map((s) => s.seatId))];
            throw ApiError.badRequest(
                `The following seats are currently reserved or booked and cannot be updated: ${blockedIds.join(", ")}`
            );
        }
    }

    const result = await prisma.seat.updateMany({
        where: {
            id: { in: seatIds },
            screenId,
            deletedAt: null,
        },
        data: { status: sStatus },
    });

    return apiResponse(res, 200, true, `${result.count} seat(s) updated successfully`, {
        updatedCount: result.count,
    });
});
