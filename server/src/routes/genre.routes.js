import express from "express";
import {
    createGenre,
    createBulkGenres,
    getAllGenres,
    getGenreById,
    getGenreBySlug,
    updateGenre,
    deleteGenre,
    deleteGenres,
} from "../controllers/genre.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { requirePermissions } from "../middleware/acl.middleware.js";

const genreRouter = express.Router();

// ─────────────────────────────────────────────────────────────
// Public routes
// ─────────────────────────────────────────────────────────────

genreRouter.get("/", getAllGenres);
genreRouter.get("/:genreId", getGenreById);
genreRouter.get("/slug/:slug", getGenreBySlug);

// ─────────────────────────────────────────────────────────────
// Protected routes — manager/owner only
// ─────────────────────────────────────────────────────────────

genreRouter.post(
    "/",
    verifyUser,
    requirePermissions("genre:create"),
    createGenre
);

genreRouter.post(
    "/bulk",
    verifyUser,
    requirePermissions("genre:create"),
    createBulkGenres
);

genreRouter.patch(
    "/:genreId",
    verifyUser,
    requirePermissions("genre:update"),
    updateGenre
);

genreRouter.delete(
    "/:genreId",
    verifyUser,
    requirePermissions("genre:delete"),
    deleteGenre
);

genreRouter.delete(
    "/",
    verifyUser,
    requirePermissions("genre:delete"),
    deleteGenres
);

export default genreRouter;
