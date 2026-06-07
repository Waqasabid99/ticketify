import express from "express";
import {
    createCinema,
    getAllCinemas,
    getCinemaById,
    getCinemaBySlug,
    updateCinema,
    toggleCinemaStatus,
    deleteCinema,
} from "../controllers/cinema.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { requirePermissions } from "../middleware/acl.middleware.js";

const cinemaRouter = express.Router();

// ─────────────────────────────────────────────────────────────
// Public routes — no auth required
// ─────────────────────────────────────────────────────────────

cinemaRouter.get("/", getAllCinemas);
cinemaRouter.get("/slug/:slug", getCinemaBySlug);
cinemaRouter.get("/:cinemaId", getCinemaById);

// ─────────────────────────────────────────────────────────────
// Protected routes — staff/manager/owner only
// ─────────────────────────────────────────────────────────────

cinemaRouter.post(
    "/",
    verifyUser,
    requirePermissions("cinema:create"),
    createCinema
);

cinemaRouter.patch(
    "/:cinemaId",
    verifyUser,
    requirePermissions("cinema:update"),
    updateCinema
);

cinemaRouter.patch(
    "/:cinemaId/status",
    verifyUser,
    requirePermissions("cinema:toggle-active"),
    toggleCinemaStatus
);

cinemaRouter.delete(
    "/:cinemaId",
    verifyUser,
    requirePermissions("cinema:delete"),
    deleteCinema
);

export default cinemaRouter;