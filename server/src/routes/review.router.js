import express from "express";
import {
    createReview,
    getMovieReviews,
    getMyReview,
    updateMyReview,
    deleteMyReview,
    getAllReviews,
    moderateReview,
    deleteReview,
    getMyReviews,
} from "../controllers/review.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { requirePermissions } from "../middleware/acl.middleware.js";

const reviewRouter = express.Router();

// Public — approved reviews + stats for a movie
reviewRouter.get(
    "/movies/my/reviews",
    verifyUser,
    requirePermissions("review:read-own"),
    getMyReviews
);

reviewRouter.get("/movies/:movieId/reviews", getMovieReviews);

// Customer — own review CRUD (order matters: /me before /:reviewId)
reviewRouter.get(
    "/movies/:movieId/reviews/me",
    verifyUser,
    requirePermissions("review:read-own"),
    getMyReview
);

reviewRouter.post(
    "/movies/:movieId/reviews",
    verifyUser,
    requirePermissions("review:create"),
    createReview
);

reviewRouter.patch(
    "/movies/:movieId/reviews/me",
    verifyUser,
    requirePermissions("review:update-own"),
    updateMyReview
);

reviewRouter.delete(
    "/movies/:movieId/reviews/me",
    verifyUser,
    requirePermissions("review:delete-own"),
    deleteMyReview
);

// ─────────────────────────────────────────────────────────────
// Admin / staff routes  →  /reviews
// ─────────────────────────────────────────────────────────────

// List all reviews across all movies (filterable)
reviewRouter.get(
    "/reviews",
    verifyUser,
    requirePermissions("review:read-all"),
    getAllReviews
);

// Approve / reject a review
reviewRouter.patch(
    "/reviews/:reviewId/status",
    verifyUser,
    requirePermissions("review:moderate"),
    moderateReview
);

// Hard delete any review
reviewRouter.delete(
    "/reviews/:reviewId",
    verifyUser,
    requirePermissions("review:delete"),
    deleteReview
);

export default reviewRouter;
