import express from "express";
import { adminRegisterUser, forgetPassword, loginUser, logoutUser, refreshToken, registerUser, resetPassword } from "../controllers/auth.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { getSafeUser } from "../utils/helper.js";
import { requireRole } from "../middleware/acl.middleware.js";
const authRouter = express.Router();

authRouter.post("/register", registerUser);
authRouter.post("/admin/register", verifyUser, requireRole("OWNER"), adminRegisterUser);
authRouter.post("/login", loginUser);
authRouter.post("/logout", verifyUser, logoutUser);
authRouter.post("/verify", verifyUser, asyncHandler(async (req, res) => {
    return apiResponse(res, 200, true, "User verified successfully", getSafeUser(req.user));
}));
authRouter.post("/refresh-token", refreshToken);
authRouter.post("/forget-password", forgetPassword);
authRouter.post("/reset-password", verifyUser, resetPassword);

export default authRouter;
