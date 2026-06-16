import express from "express";
import {
    createPaymentIntent,
    handleStripeWebhook,
    getPaymentById,
    getPaymentsByBooking,
    getAllPayments,
    retryPayment,
    getPaymentStats,
} from "../controllers/payment.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { requireRole } from "../middleware/acl.middleware.js";
import { UserRole } from "../generated/prisma/enums.ts";

const paymentRouter = express.Router();
const webhookRouter = express.Router();

webhookRouter.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
);

// ─── All routes below require authentication ──────────────────────────────────
paymentRouter.use(verifyUser);

// ─── Online Payment Flow ──────────────────────────────────────────────────────
paymentRouter.post("/intent", createPaymentIntent);
paymentRouter.post("/retry", retryPayment);

// ─── Query endpoints ──────────────────────────────────────────────────────────

// Stats — owner / manager only
paymentRouter.get(
    "/stats",
    requireRole([UserRole.OWNER, UserRole.MANAGER]),
    getPaymentStats
);

// All payments — staff and above
paymentRouter.get(
    "/",
    requireRole([UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF]),
    getAllPayments
);

// Payments for a specific booking (customer sees own, staff sees all)
paymentRouter.get("/booking/:bookingId", getPaymentsByBooking);

// Single payment by ID
paymentRouter.get("/:paymentId", getPaymentById);

export { paymentRouter, webhookRouter };
