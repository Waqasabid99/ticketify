import currency from "currency.js";
import prisma from "../config/prisma.js";
import { MovieStatus, SeatStatus, ShowSeatStatus, ShowStatus } from "../generated/prisma/enums.ts";
import { getUsdToPkrRate, pkrToUsd } from "../services/currency.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { validatePricingRules } from "../utils/validatePricing.js";

export const createShow = asyncHandler(async (req, res) => {
    const { id: createdById } = req.user;
    const { movieId, screenId, startTime, cleaningMinutes, pricingRules } = req.body;

    if (!movieId || !screenId || !startTime || !pricingRules) {
        throw ApiError.badRequest("All fields are required");
    }

    if (new Date(startTime) <= new Date()) {
        throw ApiError.badRequest("Show start time must be in the future");
    }

    // Pricing rules validation
    validatePricingRules(pricingRules);

    const movie = await prisma.movie.findFirst({
        where: { id: movieId, deletedAt: null },
    });

    if (!movie) throw ApiError.notFound("Movie not found");

    if (
        movie.status !== MovieStatus.NOW_SHOWING &&
        movie.status !== MovieStatus.COMING_SOON
    ) {
        throw ApiError.badRequest("Movie cannot be scheduled");
    }

    const screen = await prisma.screen.findFirst({
        where: { id: screenId, deletedAt: null },
    });

    if (!screen) throw ApiError.notFound("Screen not found");
    if (!screen.isActive) throw ApiError.badRequest("Screen is not active");

    const movieStartingTime = new Date(startTime);
    const hallCleaningTime = Number(cleaningMinutes) || 15;
    const endTime = new Date(movieStartingTime.getTime() + movie.durationMinutes * 60 * 1000);
    const occupiedUntilTime = new Date(endTime.getTime() + hallCleaningTime * 60 * 1000);

    const conflict = await prisma.show.findFirst({
        where: {
            screenId,
            status: ShowStatus.SCHEDULED,
            startTime: { lt: occupiedUntilTime },
            occupiedUntil: { gt: movieStartingTime },
        },
    });

    if (conflict) throw ApiError.conflict("Screen is already booked at this time");

    const seats = await prisma.seat.findMany({
        where: { screenId, deletedAt: null, status: SeatStatus.AVAILABLE },
    });

    if (!seats.length) throw ApiError.notFound("No available seats found for this screen");

    const rate = await getUsdToPkrRate();
    if (!rate) throw ApiError.internalServerError("Failed to get exchange rate");

    const show = await prisma.$transaction(async (tx) => {
        const newShow = await tx.show.create({
            data: {
                movieId,
                screenId,
                startTime: movieStartingTime,
                endTime,
                occupiedUntil: occupiedUntilTime,
                cleaningMinutes: hallCleaningTime,
                status: ShowStatus.SCHEDULED,
                createdById,
            },
        });

        await tx.showSeat.createMany({
            data: seats.map((seat) => ({
                showId: newShow.id,
                seatId: seat.id,
                status: ShowSeatStatus.AVAILABLE,
            })),
        });

        await tx.pricingRule.createMany({
            data: pricingRules.map((rule) => ({
                showId: newShow.id,
                seatType: rule.seatType ?? null,
                amountPKR: currency(rule.amountPkr, { precision: 2 }).value,
                amount: pkrToUsd(rule.amountPkr, rate),
                exchangeRate: rate,
                type: rule.type,
            })),
        });

        await tx.auditLog.create({
            data: {
                userId: createdById,
                action: "SHOW_CREATED",
                entityId: newShow.id,
                entity: "SHOW",
                metadata: {
                    ipAddress: req?.ip,
                    userAgent: req?.headers?.["user-agent"],
                },
            },
        });

        return tx.show.findUnique({
            where: { id: newShow.id },
            include: { pricingRules: true },
        });
    });

    return apiResponse(res, 201, true, "Show created successfully", show);
});

export const getAllShows = asyncHandler(async (req, res) => {
    const { page = 1, limit = 100, orderBy = "desc" } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(
        100,
        Math.max(1, Number(limit) || 10)
    );

    const skip = (pageNumber - 1) * pageSize;

    const [shows, count] = await Promise.all([
        prisma.show.findMany({
            where: {
                deletedAt: null,
                screen: {
                    deletedAt: null,
                },
                movie: {
                    deletedAt: null,
                },
            },
            include: {
                screen: {
                    select: {
                        name: true,
                        cinema: {
                            select: {
                                name: true,
                                city: true,
                                country: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        showSeats: {
                            where: {
                                status: ShowSeatStatus.AVAILABLE
                            }
                        }
                    }
                },
                movie: {
                    select: {
                        title: true,
                        genres: {
                            select: {
                                genre: {
                                    select: {
                                        name: true,
                                        slug: true,
                                    },
                                },
                            },
                        },
                        durationMinutes: true,
                        bannerUrl: true,
                        posterUrl: true,
                        description: true,
                        language: true,
                        ageRestriction: true,
                        slug: true,
                    },
                },
            },
            skip,
            take: pageSize,
            orderBy: {
                createdAt: orderBy === "desc" ? "desc" : "asc",
            },
        }),
        prisma.show.count({
            where: {
                deletedAt: null,
            },
        }),

    ]);

    return apiResponse(res, 200, true, "Shows fetched successfully", {
        shows: shows,
        showSeatStatus: Object.values(ShowSeatStatus),
        showStatus: Object.values(ShowStatus),
        movieStatus: Object.values(MovieStatus),
        seatStatus: Object.values(SeatStatus),
        totalShows: count,
        pageNumber,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
    });
});

export const getShowById = asyncHandler(async (req, res) => {
    const { showId } = req.params;

    if (!showId) throw ApiError.badRequest("Show ID is required");

    const show = await prisma.show.findFirst({
        where: { id: showId, deletedAt: null },
        include: {
            screen: {
                select: {
                    name: true,
                    cinema: {
                        select: {
                            name: true,
                            city: true,
                            country: true,
                        },
                    },
                },
            },
            movie: {
                select: {
                    title: true,
                    genres: {
                        select: {
                            genre: {
                                select: {
                                    name: true,
                                    slug: true,
                                },
                            },
                        },
                    },
                    durationMinutes: true,
                    bannerUrl: true,
                    posterUrl: true,
                    description: true,
                    language: true,
                    ageRestriction: true,
                    slug: true,
                },
            },
            pricingRules: true,
            showSeats: {
                include: {
                    seat: {
                        select: {
                            id: true,
                            seatNumber: true,
                            seatType: true,
                            rowLabel: true,
                        },
                    },
                },
            },
        },
    });

    if (!show) throw ApiError.notFound("Show not found");

    return apiResponse(res, 200, true, "Show fetched successfully", show);
});

export const getShowByMovie = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    if (!movieId) throw ApiError.badRequest("Movie ID is required");

    const [shows, count] = await Promise.all([
        prisma.show.findMany({
            where: {
                movieId: movieId,
                status: ShowStatus.SCHEDULED,
                deletedAt: null,
            },
            include: {
                screen: {
                    select: {
                        name: true,
                        cinema: {
                            select: {
                                name: true,
                                city: true,
                            },
                        },
                    },
                },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                startTime: "asc"
            }
        }),
        prisma.show.count({
            where: {
                movieId: movieId,
                status: ShowStatus.SCHEDULED,
                deletedAt: null,
            },
        }),
    ]);

    return apiResponse(res, 200, true, "Show fetched successfully", {
        shows,
        count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
    });
})

export const updateShow = asyncHandler(async (req, res) => {
    const { showId } = req.params;
    const { id: updatedById } = req.user;
    const { screenId, startTime, cleaningMinutes, status, pricingRules } = req.body;

    if (!showId) throw ApiError.badRequest("Show ID is required");

    if (startTime && new Date(startTime) <= new Date()) throw ApiError.badRequest("Show start time must be in the future");

    const existingShow = await prisma.show.findUnique({
        where: { id: showId, deletedAt: null },
    });

    if (!existingShow) throw ApiError.notFound("Show not found");

    const updateData = {};

    if (screenId) updateData.screenId = screenId;

    if (startTime || cleaningMinutes) {
        const movie = await prisma.movie.findUnique({
            where: { id: existingShow.movieId },
            select: { durationMinutes: true },
        });

        if (!movie) throw ApiError.notFound("Movie not found");

        const movieStartingTime = new Date(startTime || existingShow.startTime);
        const hallCleaningTime = Number(cleaningMinutes || existingShow.cleaningMinutes || 15);
        const endTime = new Date(movieStartingTime.getTime() + movie.durationMinutes * 60 * 1000);
        const occupiedUntilTime = new Date(endTime.getTime() + hallCleaningTime * 60 * 1000);

        updateData.startTime = movieStartingTime;
        updateData.endTime = endTime;
        updateData.occupiedUntil = occupiedUntilTime;
        updateData.cleaningMinutes = hallCleaningTime;

        const conflict = await prisma.show.findFirst({
            where: {
                screenId: screenId || existingShow.screenId,
                status: ShowStatus.SCHEDULED,
                id: { not: showId },
                startTime: { lt: occupiedUntilTime },
                occupiedUntil: { gt: movieStartingTime },
            },
        });

        if (conflict) throw ApiError.conflict("Screen is already booked at this time");
    }

    if (status) {
        const allowedStatus = Object.values(ShowStatus);
        if (!allowedStatus.includes(status)) {
            throw ApiError.badRequest(`Invalid status: ${status}`);
        }

        const invalidTransitions = {
            [ShowStatus.COMPLETED]: [ShowStatus.SCHEDULED, ShowStatus.CANCELLED],
            [ShowStatus.CANCELLED]: [ShowStatus.SCHEDULED, ShowStatus.COMPLETED],
        };

        const blockedTransitions = invalidTransitions[existingShow.status] || [];
        if (blockedTransitions.includes(status)) {
            throw ApiError.badRequest(
                `Cannot transition show from ${existingShow.status} to ${status}`
            );
        }

        updateData.status = status;
    }

    if (pricingRules && pricingRules.length > 0) {
        validatePricingRules(pricingRules);
    }

    const rate = (pricingRules && pricingRules.length > 0) ? await getUsdToPkrRate() : null;
    if (!rate) throw ApiError.badRequest("Failed to get exchange rate");

    const show = await prisma.$transaction(async (tx) => {
        const updatedShow = await tx.show.update({
            where: { id: showId },
            data: updateData,
        });

        if (pricingRules && pricingRules.length > 0) {
            await Promise.all(
                pricingRules.map(async (rule) => {
                    const existing = await tx.pricingRule.findFirst({
                        where: {
                            showId,
                            seatType: rule.seatType ?? null,
                        },
                    });

                    const data = {
                        amountPKR: currency(rule.amountPkr, { precision: 2 }).value,
                        amount: pkrToUsd(rule.amountPkr, rate),
                        exchangeRate: rate,
                        type: rule.type,
                    };

                    if (existing) {
                        await tx.pricingRule.update({ where: { id: existing.id }, data });
                    } else {
                        await tx.pricingRule.create({ data: { showId, seatType: rule.seatType ?? null, ...data } });
                    }

                })
            );
        }

        await tx.auditLog.create({
            data: {
                userId: updatedById,
                action: "SHOW_UPDATED",
                entityId: showId,
                entity: "SHOW",
                metadata: {
                    updatedFields: Object.keys(updateData),
                    pricingRulesUpdated: !!(pricingRules && pricingRules.length > 0),
                    ipAddress: req?.ip,
                    userAgent: req?.headers?.["user-agent"],
                },
            },
        });

        return updatedShow;
    });

    return apiResponse(res, 200, true, "Show updated successfully", show);
});

export const updateShowStatus = asyncHandler(async (req, res) => {
    const { showId } = req.params;

    if (!showId) throw ApiError.badRequest("Show ID is required.");

    const existingShow = await prisma.show.findUnique({
        where: { id: showId },
    });
    if (!existingShow) throw ApiError.notFound("Show not found.");

    if (existingShow.status === ShowStatus.CANCELLED || existingShow.status === ShowStatus.COMPLETED) {
        throw ApiError.badRequest("Show already completed.");
    };

    if (new Date(existingShow.startTime) < new Date()) {
        throw ApiError.badRequest("Show cannot be cancelled.");
    };

    const hasBookings = await prisma.showSeat.findFirst({
        where: {
            showId,
            bookingId: { not: null }
        }
    });

    if (hasBookings) {
        throw ApiError.badRequest("Show cannot be cancelled.");
    };

    const show = await prisma.$transaction(async (tx) => {
        const updatedShow = await tx.show.update({
            where: { id: showId },
            data: { status: ShowStatus.CANCELLED, occupiedUntil: new Date() },
        });

        await tx.auditLog.create({
            data: {
                userId: req.user?.id,
                action: "SHOW_STATUS_UPDATED",
                entityId: showId,
                entity: "SHOW",
                metadata: {
                    oldStatus: existingShow.status,
                    newStatus: updatedShow.status,
                    ipAddress: req?.ip,
                    userAgent: req?.headers?.["user-agent"],
                },
            },
        });

        return updatedShow;
    });

    return apiResponse(res, 200, true, "Show status updated successfully", show);
});

export const deleteShow = asyncHandler(async (req, res) => {
    const { showId } = req.params;

    if (!showId) throw ApiError.badRequest("Show ID is required");

    const existingShow = await prisma.show.findUnique({
        where: { id: showId, deletedAt: null },
    });

    if (!existingShow) throw ApiError.notFound("Show not found");
    if (new Date(existingShow.endTime) < new Date()) throw ApiError.badRequest("Cannot delete past show");

    const hasBookings = await prisma.showSeat.findFirst({
        where: {
            showId,
            bookingId: { not: null }
        }
    });

    if (hasBookings) throw ApiError.badRequest("Show has bookings");

    const show = await prisma.$transaction(async (tx) => {
        await tx.pricingRule.deleteMany({
            where: { showId },
        });

        await tx.showSeat.deleteMany({
            where: { showId },
        });

        await tx.show.update({
            where: { id: showId },
            data: { deletedAt: new Date(), status: ShowStatus.CANCELLED }
        });

        await tx.auditLog.create({
            data: {
                userId: req.user?.id,
                action: "SHOW_DELETED",
                entityId: showId,
                entity: "SHOW",
                metadata: {
                    ipAddress: req?.ip,
                    userAgent: req?.headers?.["user-agent"],
                },
            },
        });
        return true;
    });

    if (!show) throw ApiError.badRequest("Failed to delete show");

    return apiResponse(res, 200, true, "Show deleted successfully", show);
});
