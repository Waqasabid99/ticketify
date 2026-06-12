import express from "express";
import {
    createShow,
    getAllShows,
    getShowById,
    updateShow,
    deleteShow,
    updateShowStatus,
    getShowByMovie,
} from "../controllers/show.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { requirePermissions } from "../middleware/acl.middleware.js";

const showRouter = express.Router();

// ─────────────────────────────────────────────────────────────
// Public routes — no auth required
// Customers and guests can browse shows and their seat maps
// ─────────────────────────────────────────────────────────────

showRouter.get("/", getAllShows);
showRouter.get("/:showId", getShowById);
showRouter.get("/movie/:movieId", getShowByMovie);

// ─────────────────────────────────────────────────────────────
// Protected routes — manager/owner only
// ─────────────────────────────────────────────────────────────

showRouter.post(
    "/",
    verifyUser,
    requirePermissions("show:create"),
    createShow
);

showRouter.patch(
    "/:showId",
    verifyUser,
    requirePermissions("show:update"),
    updateShow
);

showRouter.patch(
    "/:showId/status",
    verifyUser,
    requirePermissions("show:cancel"),
    updateShowStatus
);

showRouter.delete(
    "/:showId",
    verifyUser,
    requirePermissions("show:delete"),
    deleteShow
);

export default showRouter;
