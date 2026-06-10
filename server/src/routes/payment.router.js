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

// ─── Stripe Webhook ───────────────────────────────────────────────────────────
// MUST use express.raw() — raw body required for signature verification.
// Register this BEFORE any express.json() middleware in your app.js.
//
// In app.js, mount this router BEFORE the json middleware:
//
//   import paymentRouter from "./routes/payment.routes.js";
//   app.use("/api/payments", paymentRouter);   // ← before express.json()
//   app.use(express.json());                   // ← after
//
paymentRouter.post(
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

export default paymentRouter;
