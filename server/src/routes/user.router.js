import express from "express";
import {
    getUser,
    updateCurrentUser,
    getAllUsers,
    getUserById,
    createUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    updateUser,
} from "../controllers/user.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { requirePermissions, requireRole } from "../middleware/acl.middleware.js";

const userRouter = express.Router();

// ─────────────────────────────────────────────────────────────
// Current user routes (any authenticated user)
// ─────────────────────────────────────────────────────────────

userRouter.get("/me", verifyUser, getUser);
userRouter.patch("/me", verifyUser, updateCurrentUser);

// ─────────────────────────────────────────────────────────────
// Admin user management routes
// ─────────────────────────────────────────────────────────────

userRouter.get(
    "/",
    verifyUser,
    requirePermissions("user:list"),
    getAllUsers
);

userRouter.get(
    "/:userId",
    verifyUser,
    requirePermissions("user:read"),
    getUserById
);

userRouter.post(
    "/",
    verifyUser,
    requirePermissions("user:create"),
    createUser
);

userRouter.patch(
    "/update",
    verifyUser,
    requireRole("OWNER", "MANAGER", "STAFF"),
    updateUser
);

userRouter.patch(
    "/role",
    verifyUser,
    requirePermissions("user:change-role"),
    updateUserRole
);

userRouter.patch(
    "/status",
    verifyUser,
    requirePermissions("user:change-status"),
    updateUserStatus
);

userRouter.delete(
    "/:userId",
    verifyUser,
    requirePermissions("user:delete"),
    deleteUser
);

export default userRouter;
