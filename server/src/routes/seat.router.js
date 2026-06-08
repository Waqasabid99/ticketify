import express from "express";
import {
    getScreenSeats,
    getSeatById,
    updateSeat,
    updateSeatStatus,
    bulkUpdateSeatStatus,
} from "../controllers/seat.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { requirePermissions } from "../middleware/acl.middleware.js";

const seatRouter = express.Router({ mergeParams: true });

seatRouter.get("/:screenId/seats", getScreenSeats);
seatRouter.get("/:seatId", getSeatById);
seatRouter.patch("/:seatId", verifyUser, requirePermissions("seat:update"), updateSeat);
seatRouter.patch("/:seatId/status", verifyUser, requirePermissions("seat:set-maintenance"), updateSeatStatus);
seatRouter.patch("/:screenId/bulk-status", verifyUser, requirePermissions("seat:set-maintenance"), bulkUpdateSeatStatus);

export default seatRouter;
