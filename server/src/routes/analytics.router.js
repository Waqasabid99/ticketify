import express from "express";
import { getDashboardAnalytics } from "../controllers/analytics.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";

const analyticsRouter = express.Router();

analyticsRouter.get("/dashboard", verifyUser, getDashboardAnalytics);

export default analyticsRouter;
