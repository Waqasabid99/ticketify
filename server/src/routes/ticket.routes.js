import express from "express";
import {
    getMyTickets,
    getTicketById,
    getAllTickets,
    verifyTicket,
    cancelTicket,
} from "../controllers/ticket.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { requirePermissions } from "../middleware/acl.middleware.js";

const ticketRouter = express.Router();

// ─────────────────────────────────────────────────────────────
// Customer — own tickets only
// ─────────────────────────────────────────────────────────────

ticketRouter.get(
    "/me",
    verifyUser,
    requirePermissions("ticket:read-self"),
    getMyTickets
);

// ─────────────────────────────────────────────────────────────
// Staff+ — QR scan at gate
// Placed before /:ticketId so "verify" isn't swallowed as an ID
// ─────────────────────────────────────────────────────────────

ticketRouter.get(
    "/verify/:token",
    verifyUser,
    requirePermissions("ticket:check-in"),
    verifyTicket
);

// ─────────────────────────────────────────────────────────────
// Admin / Staff — all tickets with filters
// ─────────────────────────────────────────────────────────────

ticketRouter.get(
    "/",
    verifyUser,
    requirePermissions("ticket:list"),
    getAllTickets
);

// ─────────────────────────────────────────────────────────────
// Shared — ownership guarded inside the controller
// ─────────────────────────────────────────────────────────────

ticketRouter.get(
    "/:ticketId",
    verifyUser,
    requirePermissions("ticket:read"),
    getTicketById
);

ticketRouter.patch(
    "/:ticketId/cancel",
    verifyUser,
    requirePermissions("ticket:cancel"),
    cancelTicket
);

export default ticketRouter;
