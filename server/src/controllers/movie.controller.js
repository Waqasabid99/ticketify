import prisma from "../config/prisma.js";
import { MovieStatus, ReviewStatus } from "../generated/prisma/enums.ts";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { generateUniqueSlug } from "../utils/helper.js";
import { uploadImage, deleteImage } from "../services/cloudinary.service.js";

// CREATE MOVIE
export const createMovie = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        durationMinutes,
        releaseDate,
        language,
        ageRestriction,
        trailerUrl,
        status,
        genreIds,
    } = req.body;

    if (!title || !durationMinutes || !language || !status) {
        throw ApiError.badRequest("Title, Duration, Language, and Status are required");
    }

    const allowedStatuses = Object.values(MovieStatus);
    const normalizedStatus = status.toUpperCase();
    if (!allowedStatuses.includes(normalizedStatus)) {
        throw ApiError.badRequest(`Invalid status. Must be one of: ${allowedStatuses.join(", ")}`);
    }

    const duration = Number(durationMinutes);
    if (!Number.isInteger(duration) || duration <= 0) {
        throw ApiError.badRequest("Duration must be a positive integer");
    }

    // Parse genreIds — may come as JSON string or array
    let parsedGenreIds = [];
    if (genreIds) {
        parsedGenreIds = typeof genreIds === "string" ? JSON.parse(genreIds) : genreIds;
        if (!Array.isArray(parsedGenreIds)) throw ApiError.badRequest("genreIds must be an array");
    }

    // Validate genres exist
    if (parsedGenreIds.length > 0) {
        const foundGenres = await prisma.genre.findMany({
            where: { id: { in: parsedGenreIds } },
            select: { id: true },
        });
        if (foundGenres.length !== parsedGenreIds.length) {
            throw ApiError.badRequest("One or more genre IDs are invalid");
        }
    }

    const slug = await generateUniqueSlug(title, prisma.movie, null, null);

    // Handle image uploads
    let posterUrl = null;
    let bannerUrl = null;

    if (req.files?.poster?.[0]) {
        const result = await uploadImage(req.files.poster[0].buffer, "movies/posters");
        posterUrl = result.secure_url;
    }

    if (req.files?.banner?.[0]) {
        const result = await uploadImage(req.files.banner[0].buffer, "movies/banners");
        bannerUrl = result.secure_url;
    }

    const movie = await prisma.movie.create({
        data: {
            title,
            slug,
            description: description ?? null,
            durationMinutes: duration,
            releaseDate: releaseDate ? new Date(releaseDate) : null,
            language,
            ageRestriction: ageRestriction ? Number(ageRestriction) : null,
            trailerUrl: trailerUrl ?? null,
            posterUrl,
            bannerUrl,
            status: normalizedStatus,
            genres: parsedGenreIds.length > 0
                ? {
                    create: parsedGenreIds.map((genreId) => ({ genreId })),
                }
                : undefined,
        },
        include: {
            genres: { include: { genre: true } },
        },
    });

    return apiResponse(res, 201, true, "Movie created successfully", movie);
});

// GET ALL MOVIES
export const getAllMovies = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, language, search, genreSlug, castSlug } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNumber - 1) * pageSize;

    const where = { deletedAt: null };

    if (status) {
        const normalized = status.toUpperCase();
        if (!Object.values(MovieStatus).includes(normalized)) {
            throw ApiError.badRequest("Invalid status filter");
        }
        where.status = normalized;
    }

    if (genreSlug) {
        const genre = await prisma.genre.findUnique({
            where: { slug: genreSlug },
        });

        if (!genre) {
            throw ApiError.notFound("Genre not found");
        }

        where.genres = { some: { genreId: genre.id } };
    };

    if (castSlug) {
        const cast = await prisma.cast.findUnique({
            where: { slug: castSlug },
        });

        if (!cast) throw ApiError.notFound("Cast not found");

        where.casts = { some: { id: cast.id } };
    };

    if (language) where.language = { equals: language, mode: "insensitive" };

    if (search) {
        where.title = { contains: search, mode: "insensitive" };
    }

    const [movies, total] = await Promise.all([
        prisma.movie.findMany({
            where,
            include: {
                genres: { include: { genre: true } },
                ratingReviews: {
                    select: {
                        rating: true
                    },
                    where: {
                        status: ReviewStatus.APPROVED
                    }
                }
            },
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
        }),
        prisma.movie.count({ where }),
    ]);

    return apiResponse(res, 200, true, "Movies fetched successfully", {
        movies,
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
});

// GET MOVIE BY ID OR SLUG
export const getMovieById = asyncHandler(async (req, res) => {
    const { movieId } = req.params;

    if (!movieId) throw ApiError.badRequest("Movie ID is required");

    // Support lookup by UUID or slug
    const movie = await prisma.movie.findFirst({
        where: {
            deletedAt: null,
            OR: [{ id: movieId }, { slug: movieId }],
        },
        include: {
            genres: { include: { genre: true } },
            casts: true,
        },
    });

    if (!movie) throw ApiError.notFound("Movie not found");

    return apiResponse(res, 200, true, "Movie fetched successfully", movie);
});

// GET UPCOMING MOVIES
export const getUpcomingMovies = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNumber - 1) * pageSize;

    const where = {
        deletedAt: null,
        status: MovieStatus.COMING_SOON,
    };

    if (search) {
        where.title = { contains: search, mode: "insensitive" };
    }

    const [movies, total] = await Promise.all([
        prisma.movie.findMany({
            where,
            include: {
                genres: { include: { genre: true } },
            },
            skip,
            take: pageSize,
            orderBy: { releaseDate: "asc" },
        }),
        prisma.movie.count({ where }),
    ]);

    return apiResponse(res, 200, true, "Upcoming movies fetched successfully", {
        movies,
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
});

// GET RELEASED MOVIES
export const getReleasedMovies = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNumber - 1) * pageSize;

    const where = {
        deletedAt: null,
        status: MovieStatus.NOW_SHOWING,
    };

    if (search) {
        where.title = { contains: search, mode: "insensitive" };
    }

    const [movies, total] = await Promise.all([
        prisma.movie.findMany({
            where,
            include: {
                genres: { include: { genre: true } },
            },
            skip,
            take: pageSize,
            orderBy: { releaseDate: "desc" },
        }),
        prisma.movie.count({ where }),
    ]);

    return apiResponse(res, 200, true, "Released movies fetched successfully", {
        movies,
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
});

// GET POPULAR MOVIES
export const getPopularMovies = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNumber - 1) * pageSize;

    const where = {
        deletedAt: null,
        status: MovieStatus.NOW_SHOWING,
    };

    if (search) {
        where.title = { contains: search, mode: "insensitive" };
    }

    const [movies, total] = await Promise.all([
        prisma.movie.findMany({
            where,
            include: {
                genres: { include: { genre: true } },
            },
            skip,
            take: pageSize,
            orderBy: { releaseDate: "desc" },
        }),
        prisma.movie.count({ where }),
    ]);

    return apiResponse(res, 200, true, "Popular movies fetched successfully", {
        movies,
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
});

// UPDATE MOVIE
export const updateMovie = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const {
        title,
        description,
        durationMinutes,
        releaseDate,
        language,
        ageRestriction,
        trailerUrl,
        status,
        genreIds,
    } = req.body;

    if (!movieId) throw ApiError.badRequest("Movie ID is required");

    const existing = await prisma.movie.findFirst({
        where: { id: movieId, deletedAt: null },
    });
    if (!existing) throw ApiError.notFound("Movie not found");

    const updateData = {};

    if (title) {
        updateData.title = title;
        updateData.slug = await generateUniqueSlug(title, prisma.movie, movieId, null);
    }
    if (description !== undefined) updateData.description = description;
    if (durationMinutes) {
        const duration = Number(durationMinutes);
        if (!Number.isInteger(duration) || duration <= 0)
            throw ApiError.badRequest("durationMinutes must be a positive integer");
        updateData.durationMinutes = duration;
    }
    if (releaseDate !== undefined) {
        updateData.releaseDate = releaseDate ? new Date(releaseDate) : null;
    }
    if (language) updateData.language = language;
    if (ageRestriction !== undefined) {
        updateData.ageRestriction = ageRestriction ? Number(ageRestriction) : null;
    }
    if (trailerUrl !== undefined) updateData.trailerUrl = trailerUrl;
    if (status) {
        const normalized = status.toUpperCase();
        if (!Object.values(MovieStatus).includes(normalized))
            throw ApiError.badRequest("Invalid status");
        updateData.status = normalized;
    }

    // Handle poster replacement
    if (req.files?.poster?.[0]) {
        if (existing.posterUrl) await deleteImage(existing.posterUrl);
        const result = await uploadImage(req.files.poster[0].buffer, "movies/posters");
        updateData.posterUrl = result.secure_url;
    }

    // Handle banner replacement
    if (req.files?.banner?.[0]) {
        if (existing.bannerUrl) await deleteImage(existing.bannerUrl);
        const result = await uploadImage(req.files.banner[0].buffer, "movies/banners");
        updateData.bannerUrl = result.secure_url;
    }

    // Handle genre sync (full replace if provided)
    let genreSync;
    if (genreIds !== undefined) {
        const parsed = typeof genreIds === "string" ? JSON.parse(genreIds) : genreIds;
        if (!Array.isArray(parsed)) throw ApiError.badRequest("genreIds must be an array");

        if (parsed.length > 0) {
            const found = await prisma.genre.findMany({
                where: { id: { in: parsed } },
                select: { id: true },
            });
            if (found.length !== parsed.length)
                throw ApiError.badRequest("One or more genre IDs are invalid");
        }

        genreSync = {
            deleteMany: {},
            create: parsed.map((genreId) => ({ genreId })),
        };
    }

    if (Object.keys(updateData).length === 0 && !genreSync && !req.files?.poster && !req.files?.banner) {
        throw ApiError.badRequest("No fields provided for update");
    }

    const updated = await prisma.movie.update({
        where: { id: movieId },
        data: {
            ...updateData,
            ...(genreSync ? { genres: genreSync } : {}),
        },
        include: {
            genres: { include: { genre: true } },
            casts: true,
        },
    });

    return apiResponse(res, 200, true, "Movie updated successfully", updated);
});

// DELETE MOVIE (soft delete)
export const deleteMovie = asyncHandler(async (req, res) => {
    const { movieId } = req.params;

    if (!movieId) throw ApiError.badRequest("Movie ID is required");

    const existing = await prisma.movie.findFirst({
        where: { id: movieId, deletedAt: null },
    });
    if (!existing) throw ApiError.notFound("Movie not found");

    // Block delete if active/upcoming shows exist
    const activeShow = await prisma.show.findFirst({
        where: {
            movieId,
            deletedAt: null,
            status: "SCHEDULED",
        },
    });
    if (activeShow) {
        throw ApiError.badRequest("Movie has scheduled shows and cannot be deleted");
    }

    await prisma.movie.update({
        where: { id: movieId },
        data: { deletedAt: new Date(), status: "ARCHIVED" },
    });

    return apiResponse(res, 200, true, "Movie deleted successfully", null);
});

// UPDATE MOVIE STATUS
export const updateMovieStatus = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const { status } = req.body;

    if (!movieId) throw ApiError.badRequest("Movie ID is required");
    if (!status) throw ApiError.badRequest("Status is required");

    const normalized = status.toUpperCase();
    if (!Object.values(MovieStatus).includes(normalized)) {
        throw ApiError.badRequest(`Invalid status. Must be one of: ${Object.values(MovieStatus).join(", ")}`);
    }

    const existing = await prisma.movie.findFirst({
        where: { id: movieId, deletedAt: null },
    });
    if (!existing) throw ApiError.notFound("Movie not found");

    const updated = await prisma.movie.update({
        where: { id: movieId },
        data: { status: normalized },
    });

    return apiResponse(res, 200, true, "Movie status updated successfully", updated);
});

// GET MOVIE CAST
export const getMovieCast = asyncHandler(async (req, res) => {
    const { movieId } = req.params;

    const cast = await prisma.cast.findMany({
        where: { movieId },
    });

    return apiResponse(res, 200, true, "Movie cast fetched successfully", cast);
});

// ADD CAST
export const addCast = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    let { cast } = req.body;

    if (!movieId) throw ApiError.badRequest("Movie ID is required");

    const movie = await prisma.movie.findFirst({
        where: { id: movieId, deletedAt: null },
    });
    if (!movie) throw ApiError.notFound("Movie not found");

    if (!cast) throw ApiError.badRequest("cast is required");
    if (!Array.isArray(cast)) cast = [cast];

    for (const member of cast) {
        if (!member.name || !member.role) {
            throw ApiError.badRequest("Each cast member must have name and role");
        }
        member.slug = await generateUniqueSlug(member.name, prisma.cast);
    }

    const result = await prisma.$transaction(async (tx) => {
        await tx.cast.deleteMany({
            where: { movieId },
        });

        const created = await tx.cast.createMany({
            data: cast.map((m) => ({
                movieId,
                name: m.name,
                slug: m.slug,
                role: m.role,
                imageUrl: m.imageUrl ?? null,
            })),
        });

        await tx.auditLog.create({
            data: {
                userId: req?.user?.id,
                action: "CAST_ADD",
                entity: "CAST",
                entityId: movieId,
                metadata: {
                    ip: req?.ip,
                    userAgent: req?.headers["user-agent"],
                },
            },
        });

        return { count: created.count };
    });

    return apiResponse(res, 201, true, "Cast added successfully", result);
});

// UPDATE CAST
export const updateCast = asyncHandler(async (req, res) => {
    const { movieId, castId } = req.params;
    const { name, role } = req.body;

    if (!movieId) throw ApiError.badRequest("Movie ID is required");
    if (!castId) throw ApiError.badRequest("Cast ID is required");

    const member = await prisma.cast.findFirst({
        where: { id: castId, movieId },
    });
    if (!member) throw ApiError.notFound("Cast member not found");

    const updated = await prisma.cast.update({
        where: { id: castId },
        data: {
            name: name ?? member.name,
            role: role ?? member.role,
        },
    });

    return apiResponse(res, 200, true, "Cast updated successfully", updated);
});

// DELETE CAST MEMBER
export const removeCastMember = asyncHandler(async (req, res) => {
    const { movieId, castId } = req.params;

    const member = await prisma.cast.findFirst({
        where: { id: castId, movieId },
    });
    if (!member) throw ApiError.notFound("Cast member not found");

    await prisma.cast.delete({ where: { id: castId } });

    return apiResponse(res, 200, true, "Cast member removed successfully", null);
});

// DELETE CAST BY MOVIE ID
export const deleteCastByMovieId = asyncHandler(async (req, res) => {
    const { movieId } = req.params;

    const member = await prisma.cast.findFirst({
        where: {
            movieId,
        },
    });
    if (!member) throw ApiError.notFound("Cast not found");

    await prisma.cast.deleteMany({ where: { movieId } });

    return apiResponse(res, 200, true, "Cast deleted successfully", null);
});