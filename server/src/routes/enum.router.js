import express from "express";
const enumRouter = express.Router();
import { getEnum } from "../controllers/enum.controller.js";

enumRouter.get("/", getEnum);

export default enumRouter;