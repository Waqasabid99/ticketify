import prisma from "../config/prisma.js";
import { asyncHandler, apiResponse } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { generateUniqueSlug } from "../utils/helper.js";

export const createGenre = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) throw ApiError.badRequest("Genre name is required.");

    const existingGenre = await prisma.genre.findFirst({
        where: {
            name: {
                equals: name,
                mode: "insensitive"
            }
        }
    })

    if (existingGenre) {
        throw ApiError.badRequest("Genre already exists")
    }

    const slug = await generateUniqueSlug(name, prisma.genre);

    const genre = await prisma.genre.create({
        data: {
            name,
            slug,
            description: description || "",
        }
    });

    if (!genre) throw ApiError.badRequest("Failed to create genre");

    return apiResponse(res, 201, true, "Genre created successfully", genre)
});

export const createBulkGenres = asyncHandler(async (req, res) => {
    const { genres } = req.body;

    if (!genres || genres.length === 0) throw ApiError.badRequest("Genres are required");

    const createdGenres = await Promise.all(
        genres?.map(async (genre) => {
            if (!genre?.name) throw ApiError.badRequest("Genre name is required");
            const slug = await generateUniqueSlug(genre.name, prisma.genre);
            return prisma.genre.create({
                data: {
                    name: genre.name,
                    slug,
                    description: genre.description || "",
                },
            });
        })
    );

    if (!createdGenres) throw ApiError.badRequest("Failed to create genres");

    return apiResponse(res, 201, true, "Genres created successfully", createdGenres);
});

export const getAllGenres = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortOrder = "desc" } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(
        100,
        Math.max(1, Number(limit) || 10)
    );

    const skip = (pageNumber - 1) * pageSize;

    const [genres, total] = await Promise.all([
        prisma.genre.findMany({
            take: pageSize,
            skip: skip,
            orderBy: {
                createdAt: sortOrder === "desc" ? "desc" : "asc"
            }
        }),
        prisma.genre.count(),
    ])

    return apiResponse(res, 200, true, "Genres fetched successfully",
        { genres, total, page: pageNumber, limit: pageSize, totalPages: Math.ceil(total / pageSize) });
});

export const getGenreById = asyncHandler(async (req, res) => {
    const { genreId } = req.params;

    if (!genreId) throw ApiError.badRequest("Genre ID is required");

    const genre = await prisma.genre.findUnique({
        where: { id: genreId },
    });

    if (!genre) throw ApiError.notFound("Genre not found");

    return apiResponse(res, 200, true, "Genre fetched successfully", genre);
});

export const getGenreBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    if (!slug) throw ApiError.badRequest("Slug is required");

    const genre = await prisma.genre.findFirst({
        where: { slug },
    });

    if (!genre) throw ApiError.notFound("Genre not found");

    return apiResponse(res, 200, true, "Genre fetched successfully", genre);
});

export const updateGenre = asyncHandler(async (req, res) => {
    const { genreId } = req.params;
    const { name, description } = req.body;

    let updateData = {};

    if (name) {
        const slug = await generateUniqueSlug(name, prisma.genre, genreId);
        updateData.name = name;
        updateData.slug = slug;
    }

    if (description) updateData.description = description;

    if (Object.keys(updateData).length === 0) throw ApiError.badRequest("No fields provided for update");

    const genre = await prisma.genre.update({
        where: { id: genreId },
        data: updateData
    });

    if (!genre) throw ApiError.badRequest("Failed to update genre");

    return apiResponse(res, 200, true, "Genre updated successfully", genre);
});

export const deleteGenre = asyncHandler(async (req, res) => {
    const { genreId } = req.params;

    if (!genreId) throw ApiError.badRequest("Genre ID is required");

    const existingGenre = await prisma.genre.findUnique({
        where: { id: genreId },
    });

    if (!existingGenre) throw ApiError.notFound("Genre not found");

    const genre = await prisma.genre.delete({
        where: { id: genreId },
    });

    if (!genre) throw ApiError.badRequest("Failed to delete genre");

    return apiResponse(res, 200, true, "Genre deleted successfully", genre);
});

export const deleteGenres = asyncHandler(async (req, res) => {
    const { genreIds } = req.body;

    if (!genreIds) throw ApiError.badRequest("Genre IDs are required");

    const deletedGenres = await prisma.genre.deleteMany({
        where: { id: { in: genreIds } },
    });

    if (!deletedGenres) throw ApiError.badRequest("Failed to delete genres");

    return apiResponse(res, 200, true, "Genres deleted successfully", deletedGenres);
});
