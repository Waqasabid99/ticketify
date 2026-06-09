import express from "express";
import {
    createBooking,
    getAllBookings,
    getMyBookings,
    getBookingById,
    confirmBooking,
    cancelBooking,
    expireStaleBookings,
    getShowSeatAvailability,
} from "../controllers/booking.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { requirePermissions, requireOwnershipOrPermission } from "../middleware/acl.middleware.js";
import prisma from "../config/prisma.js";

const bookingRouter = express.Router();

bookingRouter.get(
    "/shows/:showId/seats",
    getShowSeatAvailability
);

bookingRouter.post(
    "/",
    verifyUser,
    requirePermissions("booking:create"),
    createBooking
);

bookingRouter.get(
    "/me",
    verifyUser,
    requirePermissions("booking:list-self"),
    getMyBookings
);

bookingRouter.get(
    "/",
    verifyUser,
    requirePermissions("booking:list"),
    getAllBookings
);

bookingRouter.get(
    "/:bookingId",
    verifyUser,
    requireOwnershipOrPermission(
        "booking:read",
        async (req) => {
            const booking = await prisma.booking.findUnique({
                where: { id: req.params.bookingId },
                select: { userId: true },
            });
            return booking?.userId;
        }
    ),
    getBookingById
);

bookingRouter.patch(
    "/:bookingId/confirm",
    verifyUser,
    requirePermissions("booking:confirm"),
    confirmBooking
);

bookingRouter.patch(
    "/:bookingId/cancel",
    verifyUser,
    requireOwnershipOrPermission(
        "booking:cancel",
        async (req) => {
            const booking = await prisma.booking.findUnique({
                where: { id: req.params.bookingId },
                select: { userId: true },
            });
            return booking?.userId;
        }
    ),
    cancelBooking
);

// Internal / cron route — owner / manager only
// Expires PENDING and RESERVED bookings whose expiresAt has passed

bookingRouter.post(
    "/internal/expire",
    verifyUser,
    requirePermissions("booking:list", "booking:cancel"),
    expireStaleBookings
);

export default bookingRouter;
