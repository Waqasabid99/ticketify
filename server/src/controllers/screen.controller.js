import prisma from "../config/prisma.js";
import { screenType, SeatType } from "../generated/prisma/enums.ts";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { generateUniqueSlug } from "../utils/helper.js";
import { normalizeRowLabels, buildSeatData } from "../utils/screenHelpers.js";

export const createScreen = asyncHandler(async (req, res) => {
    const { cinemaId, name, type, seatsPerRow, rows, seatType } = req.body;

    if (!cinemaId || !name || !type || !seatsPerRow || rows === undefined || !seatType) {
        throw ApiError.badRequest("All fields are required");
    }

    const numSeatsPerRow = Number(seatsPerRow);
    if (!Number.isInteger(numSeatsPerRow) || numSeatsPerRow <= 0) {
        throw ApiError.badRequest("seatsPerRow must be a positive integer");
    }
    if (numSeatsPerRow > 100) {
        throw ApiError.badRequest("seatsPerRow cannot exceed 100");
    }

    const allowedScreenTypes = Object.values(screenType);
    const sType = type.toUpperCase();
    if (!allowedScreenTypes.includes(sType))
        throw ApiError.badRequest("Invalid screen type");

    const allowedSeatTypes = Object.values(SeatType);
    const sSeatType = seatType.toUpperCase();
    if (!allowedSeatTypes.includes(sSeatType))
        throw ApiError.badRequest("Invalid seat type");

    // All row normalization + validation lives in the helper
    const rowLabels = normalizeRowLabels(rows);

    const cinema = await prisma.cinema.findFirst({
        where: { id: cinemaId, deletedAt: null },
    });
    if (!cinema) throw ApiError.notFound("Cinema not found");

    const slug = await generateUniqueSlug(name, prisma.screen, null, null);
    const totalCapacity = rowLabels.length * numSeatsPerRow;

    const screen = await prisma.$transaction(async (tx) => {
        const newScreen = await tx.screen.create({
            data: {
                cinemaId,
                name,
                slug,
                type: sType,
                capacity: totalCapacity,
            },
            include: { cinema: true },
        });

        const seatData = buildSeatData(newScreen.id, rowLabels, numSeatsPerRow, sSeatType);
        await tx.seat.createMany({ data: seatData });

        return {
            ...newScreen,
            totalSeats: totalCapacity,
            rows: rowLabels,
            seatsPerRow: numSeatsPerRow,
        };
    });

    return apiResponse(res, 201, true, "Screen created successfully", screen);
});

export const getAllScreens = asyncHandler(async (req, res) => {
    const { limit = 10, page = 1 } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(
        100,
        Math.max(1, Number(limit) || 10)
    );

    const skip = (pageNumber - 1) * pageSize;

    const [screens, total] = await Promise.all([
        prisma.screen.findMany({
            where: { deletedAt: null },
            include: {
                cinema: true
            },
            skip,
            take: pageSize,
            orderBy: {
                createdAt: "desc"
            }
        }),
        prisma.screen.count({
            where: { deletedAt: null },
        })
    ])
    return apiResponse(res, 200, true, "Screens fetched successfully",
        {
            screens,
            screenType: Object.values(screenType),
            seatType: Object.values(SeatType),
            total,
            page: pageNumber,
            limit: pageSize,
            totalPages: Math.ceil(total / pageSize)
        });
});

export const getScreenById = asyncHandler(async (req, res) => {
    const { screenId } = req.params;

    if (!screenId) throw ApiError.badRequest("Screen ID is required");

    const screen = await prisma.screen.findFirst({
        where: { id: screenId, deletedAt: null },
        include: {
            cinema: true,
            seats: true
        },
    });

    if (!screen) throw ApiError.notFound("Screen not found");
    return apiResponse(res, 200, true, "Screen fetched successfully", screen);
});

export const updateScreen = asyncHandler(async (req, res) => {
    const { screenId } = req.params;
    const { name, type } = req.body;

    if (!screenId) throw ApiError.badRequest("Screen ID is required");

    const existingScreen = await prisma.screen.findFirst({
        where: { id: screenId, deletedAt: null }
    });

    if (!existingScreen) throw ApiError.notFound("Screen not found");
    const updateData = {};
    if (name) {
        const slug = await generateUniqueSlug(name, prisma.screen, screenId, null);
        updateData.name = name;
        updateData.slug = slug;
    }
    if (type) {
        const allowedScreenTypes = Object.values(screenType);
        const sType = type.toUpperCase();
        if (!allowedScreenTypes.includes(sType)) throw ApiError.badRequest("Invalid screen type");
        updateData.type = sType;
    }
    if (Object.keys(updateData).length === 0) throw ApiError.badRequest("No fields provided for update");
    const updatedScreen = await prisma.screen.update({
        where: { id: screenId },
        data: updateData,
        include: {
            cinema: true
        }
    });
    return apiResponse(res, 200, true, "Screen updated successfully", updatedScreen);
});

export const toggleScreenStatus = asyncHandler(async (req, res) => {
    const { screenId } = req.params;
    const { status } = req.body;
    if (!screenId) throw ApiError.badRequest("Screen ID is required");
    if (typeof status !== "boolean") throw ApiError.badRequest("Status must be boolean");
    const existingScreen = await prisma.screen.findFirst({
        where: { id: screenId, deletedAt: null }
    });
    if (!existingScreen) throw ApiError.notFound("Screen not found");
    const updatedScreen = await prisma.screen.update({
        where: { id: screenId },
        data: { isActive: status },
        include: {
            cinema: true
        }
    });
    return apiResponse(res, 200, true, "Screen status updated successfully", updatedScreen);
});

export const deleteScreen = asyncHandler(async (req, res) => {
    const { screenId } = req.params;
    if (!screenId) throw ApiError.badRequest("Screen ID is required");
    const existingScreen = await prisma.screen.findFirst({
        where: { id: screenId, deletedAt: null }
    });

    if (!existingScreen) throw ApiError.notFound("Screen not found");

    // Check for existing showtimes
    const activeShow = await prisma.show.findFirst({
        where: {
            screenId,
            deletedAt: null,
            status: { in: ["SCHEDULED"] }
        }
    });
    if (activeShow) throw ApiError.badRequest("Screen has scheduled shows, cannot delete");

    // Bookings are reached through shows, not directly
    const activeBooking = await prisma.booking.findFirst({
        where: {
            show: { screenId },
            status: { in: ["PENDING", "RESERVED", "CONFIRMED"] }
        }
    });
    if (activeBooking) throw ApiError.badRequest("Screen has active bookings, cannot delete");
    // Perform soft delete
    const updatedScreen = await prisma.screen.update({
        where: { id: screenId },
        data: {
            deletedAt: new Date(),
            isActive: false
        }
    });
    return apiResponse(res, 200, true, "Screen deleted successfully", updatedScreen);
});
