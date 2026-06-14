import prisma from "../config/prisma.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { generateUniqueSlug } from "../utils/helper.js";

export const createCinema = asyncHandler(async (req, res) => {
    const { name, address, city, country, phone, email } = req.body;

    if (!name || !address) throw ApiError.badRequest("Name and Address is required");

    const existingCinema = await prisma.cinema.findFirst({
        where: {
            name: {
                equals: name,
                mode: "insensitive"
            },
            deletedAt: null,
        },
    });

    if (existingCinema) throw ApiError.badRequest("Cinema already exists");

    const slug = await generateUniqueSlug(name, prisma.cinema, null, null);

    const cinema = await prisma.cinema.create({
        data: {
            name,
            address,
            slug,
            city: city || "",
            country: country || "",
            phone: phone || "",
            email: email || "",
        },
    });

    return apiResponse(res, 201, true, "Cinema created successfully", cinema);
});

export const getAllCinemas = asyncHandler(async (req, res) => {
    const { search, city, name, country, sortBy, sortOrder, page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(
        100,
        Math.max(1, Number(limit) || 10)
    );

    const skip = (pageNumber - 1) * pageSize;

    const where = {
        deletedAt: null,
    };

    const allowedSortFields = [
        "name",
        "city",
        "country",
        "createdAt",
        "updatedAt"
    ];

    const sortField = allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";

    const sortOrderValue = sortOrder?.toLowerCase() || "desc";

    if (search) {
        where.OR = [
            {
                name: {
                    contains: search,
                    mode: "insensitive"
                }
            },
            {
                city: {
                    contains: search,
                    mode: "insensitive"
                }
            }
        ]
    }

    if (city) {
        where.city = {
            equals: city,
            mode: "insensitive"
        }
    }

    if (name) {
        where.name = {
            equals: name,
            mode: "insensitive"
        }
    }

    if (country) {
        where.country = {
            equals: country,
            mode: "insensitive"
        }
    }

    const [cinemas, total] = await Promise.all([
        prisma.cinema.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: {
                [sortField]: sortOrderValue,
            },
        }),
        prisma.cinema.count({
            where,
        })
    ]);

    return apiResponse(res, 200, true, "Cinemas fetched successfully", {
        cinemas,
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize)
    });
});

export const getCinemaById = asyncHandler(async (req, res) => {
    const { cinemaId } = req.params;

    if (!cinemaId) throw ApiError.badRequest("Cinema ID is required");

    const cinema = await prisma.cinema.findFirst({
        where: {
            id: cinemaId,
            deletedAt: null,
            isActive: true,
        },
    });

    if (!cinema) throw ApiError.notFound("Cinema not found");

    return apiResponse(res, 200, true, "Cinema fetched successfully", cinema);
});

export const getCinemaBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    if (!slug) throw ApiError.badRequest("Slug is required");

    const cinema = await prisma.cinema.findFirst({
        where: {
            slug,
            deletedAt: null,
            isActive: true,
        },
    });

    if (!cinema) throw ApiError.notFound("Cinema not found");

    return apiResponse(res, 200, true, "Cinema fetched successfully", cinema);
});

export const updateCinema = asyncHandler(async (req, res) => {
    const { cinemaId } = req.params;
    const { name, address, city, country, phone, email } = req.body;

    if (!cinemaId) throw ApiError.badRequest("Cinema ID is required");

    const existingCinema = await prisma.cinema.findUnique({
        where: {
            id: cinemaId,
        },
    });

    if (!existingCinema || existingCinema?.deletedAt) throw ApiError.notFound("Cinema not found");

    const updateData = {};
    if (name) {
        updateData.name = name;
        const slug = await generateUniqueSlug(name, prisma.cinema, cinemaId, null, null);
        updateData.slug = slug;
    }
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (country) updateData.country = country;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;

    if (Object.keys(updateData).length === 0) {
        throw ApiError.badRequest("No fields provided for update");
    }

    const cinema = await prisma.cinema.update({
        where: {
            id: cinemaId,
        },
        data: updateData,
    });

    return apiResponse(res, 200, true, "Cinema updated successfully", cinema);
});

export const toggleCinemaStatus = asyncHandler(async (req, res) => {
    const { cinemaId } = req.params;
    const { status } = req.body;

    if (!cinemaId) throw ApiError.badRequest("Cinema ID is required");
    if (typeof status !== "boolean") {
        throw ApiError.badRequest("Status must be boolean");
    }

    const existingCinema = await prisma.cinema.findUnique({
        where: {
            id: cinemaId,
        },
    });

    if (!existingCinema || existingCinema?.deletedAt) throw ApiError.notFound("Cinema not found");

    const cinema = await prisma.cinema.update({
        where: {
            id: cinemaId,
        },
        data: {
            isActive: status,
        },
    });

    return apiResponse(res, 200, true, "Cinema status updated successfully", cinema);
});

export const deleteCinema = asyncHandler(async (req, res) => {
    const { cinemaId } = req.params;

    if (!cinemaId) throw ApiError.badRequest("Cinema ID is required");

    const existingCinema = await prisma.cinema.findUnique({
        where: {
            id: cinemaId,
        },
    });

    if (!existingCinema || existingCinema.deletedAt) throw ApiError.notFound("Cinema not found");

    await prisma.cinema.update({
        where: {
            id: cinemaId,
        },
        data: {
            deletedAt: new Date(),
            isActive: false,
        },
    });

    return apiResponse(res, 200, true, "Cinema deleted successfully", {});
});
