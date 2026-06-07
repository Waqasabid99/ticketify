import express from "express";
import {
    createMovie,
    getAllMovies,
    getMovieById,
    updateMovie,
    deleteMovie,
    updateMovieStatus,
    addCast,
    removeCastMember,
    deleteCastByMovieId,
    updateCast,
    getMovieCast,
} from "../controllers/movie.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { requirePermissions } from "../middleware/acl.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const movieRouter = express.Router();

// ─────────────────────────────────────────────────────────────
// Public routes
// ─────────────────────────────────────────────────────────────

movieRouter.get("/", getAllMovies);
movieRouter.get("/:movieId", getMovieById);
movieRouter.get("/:movieId/cast", getMovieCast);

// ─────────────────────────────────────────────────────────────
// Protected routes — manager/owner only
// ─────────────────────────────────────────────────────────────

movieRouter.post(
    "/",
    verifyUser,
    requirePermissions("movie:create"),
    upload.fields([{ name: "poster", maxCount: 1 }, { name: "banner", maxCount: 1 }]),
    createMovie
);

movieRouter.patch(
    "/:movieId",
    verifyUser,
    requirePermissions("movie:update"),
    upload.fields([{ name: "poster", maxCount: 1 }, { name: "banner", maxCount: 1 }]),
    updateMovie
);

movieRouter.patch(
    "/:movieId/status",
    verifyUser,
    requirePermissions("movie:update"),
    updateMovieStatus
);

movieRouter.delete(
    "/:movieId",
    verifyUser,
    requirePermissions("movie:delete"),
    deleteMovie
);

// ─────────────────────────────────────────────────────────────
// Cast management
// ─────────────────────────────────────────────────────────────

movieRouter.post(
    "/:movieId/cast",
    verifyUser,
    requirePermissions("movie:update"),
    addCast
);

movieRouter.patch(
    "/:movieId/cast/:castId",
    verifyUser,
    requirePermissions("movie:update"),
    updateCast
);

movieRouter.delete(
    "/:movieId/cast/:castId",
    verifyUser,
    requirePermissions("movie:update"),
    removeCastMember
);

movieRouter.delete(
    "/:movieId/cast",
    verifyUser,
    requirePermissions("movie:update"),
    deleteCastByMovieId
);

export default movieRouter;
