import prisma from "../config/prisma.js";
import { ReviewStatus, BookingStatus, UserRole } from "../generated/prisma/enums.ts";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function findEligibleBooking(userId, movieId) {
    return prisma.booking.findFirst({
        where: {
            userId,
            status: BookingStatus.CONFIRMED,
            show: { movieId },
        },
        select: { id: true },
    });
}

// ─── Create Review ────────────────────────────────────────────────────────────
export const createReview = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const { id: userId } = req.user;
    const { rating, review } = req.body;

    // ── Validate movie ────────────────────────────────────────────────────────
    const movie = await prisma.movie.findFirst({
        where: { id: movieId, deletedAt: null },
        select: { id: true, title: true },
    });
    if (!movie) throw ApiError.notFound("Movie not found.");

    // ── Validate rating ───────────────────────────────────────────────────────
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 10) {
        throw ApiError.badRequest("Rating must be an integer between 1 and 10.");
    }

    // ── Duplicate guard ───────────────────────────────────────────────────────
    const existing = await prisma.ratingReview.findUnique({
        where: { movieId_userId: { movieId, userId } },
        select: { id: true },
    });
    if (existing) {
        throw ApiError.conflict("You have already submitted a review for this movie.");
    }

    // ── Verified purchase check ───────────────────────────────────────────────
    const eligibleBooking = await findEligibleBooking(userId, movieId);
    const isVerified = Boolean(eligibleBooking);

    const newReview = await prisma.ratingReview.create({
        data: {
            movieId,
            userId,
            rating: parsedRating,
            review: review?.trim() ?? null,
            verified: isVerified,
            bookingId: eligibleBooking?.id ?? null,
            status: ReviewStatus.PENDING,
        },
        include: {
            user: { select: { id: true, firstName: true, lastName: true } },
        },
    });

    return apiResponse(
        res,
        201,
        true,
        isVerified
            ? "Review submitted successfully. It will appear after approval."
            : "Review submitted. Note: reviews from verified ticket holders are prioritised.",
        newReview
    );
});

// ─── Get Reviews For a Movie (public) ────────────────────────────────────────
export const getMovieReviews = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const {
        page = 1,
        limit = 10,
        verified,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = req.query;

    const movie = await prisma.movie.findFirst({
        where: { id: movieId, deletedAt: null },
        select: { id: true },
    });
    if (!movie) throw ApiError.notFound("Movie not found.");

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (pageNumber - 1) * pageSize;

    const allowedSortFields = ["createdAt", "rating"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const order = sortOrder === "asc" ? "asc" : "desc";

    const where = {
        movieId,
        status: ReviewStatus.APPROVED,
    };

    if (verified !== undefined) {
        where.verified = verified === "true";
    }

    const [reviews, total, aggregate] = await Promise.all([
        prisma.ratingReview.findMany({
            where,
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
            },
            skip,
            take: pageSize,
            orderBy: { [sortField]: order },
        }),
        prisma.ratingReview.count({ where }),
        // Aggregate stats across ALL approved reviews for this movie (ignore filters)
        prisma.ratingReview.aggregate({
            where: { movieId, status: ReviewStatus.APPROVED },
            _avg: { rating: true },
            _count: { rating: true },
            _min: { rating: true },
            _max: { rating: true },
        }),
    ]);

    // Rating breakdown (1–10 counts)
    const breakdown = await prisma.ratingReview.groupBy({
        by: ["rating"],
        where: { movieId, status: ReviewStatus.APPROVED },
        _count: { rating: true },
        orderBy: { rating: "asc" },
    });

    return apiResponse(res, 200, true, "Reviews fetched successfully.", {
        reviews,
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
            averageRating: aggregate._avg.rating
                ? Math.round(aggregate._avg.rating * 10) / 10
                : null,
            totalReviews: aggregate._count.rating,
            lowestRating: aggregate._min.rating,
            highestRating: aggregate._max.rating,
            breakdown: breakdown.map((b) => ({
                rating: b.rating,
                count: b._count.rating,
            })),
        },
    });
});

// ─── Get My Review For a Movie ────────────────────────────────────────────────
export const getMyReview = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const { id: userId } = req.user;

    const review = await prisma.ratingReview.findUnique({
        where: { movieId_userId: { movieId, userId } },
        include: {
            user: { select: { id: true, firstName: true, lastName: true } },
        },
    });

    if (!review) throw ApiError.notFound("You have not reviewed this movie yet.");

    return apiResponse(res, 200, true, "Your review fetched successfully.", review);
});

// ─── Update My Review ─────────────────────────────────────────────────────────
export const updateMyReview = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const { id: userId } = req.user;
    const { rating, review } = req.body;

    const existing = await prisma.ratingReview.findUnique({
        where: { movieId_userId: { movieId, userId } },
        select: { id: true },
    });
    if (!existing) throw ApiError.notFound("Review not found. Submit a review first.");

    const updateData = {};

    if (rating !== undefined) {
        const parsedRating = Number(rating);
        if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 10) {
            throw ApiError.badRequest("Rating must be an integer between 1 and 10.");
        }
        updateData.rating = parsedRating;
    }

    if (review !== undefined) {
        updateData.review = review?.trim() ?? null;
    }

    if (Object.keys(updateData).length === 0) {
        throw ApiError.badRequest("No fields provided for update.");
    }

    // Reset to PENDING so updated content goes through moderation again
    updateData.status = ReviewStatus.PENDING;

    const updated = await prisma.ratingReview.update({
        where: { movieId_userId: { movieId, userId } },
        data: updateData,
        include: {
            user: { select: { id: true, firstName: true, lastName: true } },
        },
    });

    return apiResponse(res, 200, true, "Review updated. It will appear after re-approval.", updated);
});

// ─── Delete My Review ─────────────────────────────────────────────────────────
export const deleteMyReview = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const { id: userId } = req.user;

    const existing = await prisma.ratingReview.findUnique({
        where: { movieId_userId: { movieId, userId } },
        select: { id: true },
    });
    if (!existing) throw ApiError.notFound("Review not found.");

    await prisma.ratingReview.delete({
        where: { movieId_userId: { movieId, userId } },
    });

    return apiResponse(res, 200, true, "Review deleted successfully.", null);
});

// ─── Admin: Get All Reviews ───────────────────────────────────────────────────
export const getAllReviews = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        movieId,
        userId,
        verified,
    } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNumber - 1) * pageSize;

    const where = {};

    if (status) {
        const normalized = status.toUpperCase();
        if (!Object.values(ReviewStatus).includes(normalized)) {
            throw ApiError.badRequest(
                `Invalid status. Must be one of: ${Object.values(ReviewStatus).join(", ")}`
            );
        }
        where.status = normalized;
    }

    if (movieId) where.movieId = movieId;
    if (userId) where.userId = userId;
    if (verified !== undefined) where.verified = verified === "true";

    const [reviews, total] = await Promise.all([
        prisma.ratingReview.findMany({
            where,
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
                movie: { select: { id: true, title: true, slug: true } },
            },
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
        }),
        prisma.ratingReview.count({ where }),
    ]);

    return apiResponse(res, 200, true, "Reviews fetched successfully.", {
        reviews,
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
});

// ─── Admin: Moderate Review ───────────────────────────────────────────────────
export const moderateReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { status } = req.body;
    const { id: moderatorId } = req.user;

    if (!status) throw ApiError.badRequest("Status is required.");

    const normalized = status.toUpperCase();
    const allowedTransitions = [ReviewStatus.APPROVED, ReviewStatus.REJECTED];
    if (!allowedTransitions.includes(normalized)) {
        throw ApiError.badRequest("Status must be APPROVED or REJECTED.");
    }

    const review = await prisma.ratingReview.findUnique({
        where: { id: Number(reviewId) },
        select: { id: true, status: true, movieId: true, userId: true },
    });
    if (!review) throw ApiError.notFound("Review not found.");

    if (review.status === normalized) {
        throw ApiError.badRequest(`Review is already ${normalized.toLowerCase()}.`);
    }

    const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.ratingReview.update({
            where: { id: Number(reviewId) },
            data: { status: normalized },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
                movie: { select: { id: true, title: true } },
            },
        });

        await tx.auditLog.create({
            data: {
                userId: moderatorId,
                action: `REVIEW_${normalized}`,
                entity: "RATING_REVIEW",
                entityId: String(review.id),
                metadata: {
                    movieId: review.movieId,
                    reviewUserId: review.userId,
                    previousStatus: review.status,
                    newStatus: normalized,
                },
            },
        });

        return result;
    });

    return apiResponse(
        res,
        200,
        true,
        `Review ${normalized.toLowerCase()} successfully.`,
        updated
    );
});

// ─── Admin: Delete Any Review ─────────────────────────────────────────────────
export const deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { id: deletedBy } = req.user;

    const review = await prisma.ratingReview.findUnique({
        where: { id: Number(reviewId) },
        select: { id: true, movieId: true, userId: true },
    });
    if (!review) throw ApiError.notFound("Review not found.");

    await prisma.$transaction(async (tx) => {
        await tx.ratingReview.delete({ where: { id: Number(reviewId) } });

        await tx.auditLog.create({
            data: {
                userId: deletedBy,
                action: "REVIEW_DELETED",
                entity: "RATING_REVIEW",
                entityId: String(review.id),
                metadata: {
                    movieId: review.movieId,
                    reviewUserId: review.userId,
                },
            },
        });
    });

    return apiResponse(res, 200, true, "Review deleted successfully.", null);
});
