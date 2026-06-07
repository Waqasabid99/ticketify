import express from "express";
import {
    createScreen,
    getAllScreens,
    getScreenById,
    updateScreen,
    toggleScreenStatus,
    deleteScreen,
} from "../controllers/screen.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { requirePermissions } from "../middleware/acl.middleware.js";

const screenRouter = express.Router();

// ─────────────────────────────────────────────────────────────
// Public routes — no auth required
// Customers and guests can browse screens and their seat maps
// ─────────────────────────────────────────────────────────────

screenRouter.get("/", getAllScreens);
screenRouter.get("/:screenId", getScreenById);

// ─────────────────────────────────────────────────────────────
// Protected routes — manager/owner only
// ─────────────────────────────────────────────────────────────

screenRouter.post(
    "/",
    verifyUser,
    requirePermissions("screen:create"),
    createScreen
);

screenRouter.patch(
    "/:screenId",
    verifyUser,
    requirePermissions("screen:update"),
    updateScreen
);

screenRouter.patch(
    "/:screenId/status",
    verifyUser,
    requirePermissions("screen:toggle-active"),
    toggleScreenStatus
);

screenRouter.delete(
    "/:screenId",
    verifyUser,
    requirePermissions("screen:delete"),
    deleteScreen
);

export default screenRouter;
