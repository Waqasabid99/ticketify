import express from "express";
import { verifyTicket } from "../controllers/ticket.controller.js";
const ticketRouter = express.Router();

ticketRouter.get(
    "/verify/:token",
    verifyTicket
)

export default ticketRouter;