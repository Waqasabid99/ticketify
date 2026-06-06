import express from "express";
import { verifyEmail } from "../services/email.service.js";

const emailRouter = express.Router();

emailRouter.post("/verify", verifyEmail);

export default emailRouter;