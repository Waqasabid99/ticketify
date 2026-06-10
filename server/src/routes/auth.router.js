import express from "express";
import { adminRegisterUser, forgetPassword, loginUser, logoutUser, refreshToken, registerUser, resetPassword, verifyPasswordReset, verifyUsers } from "../controllers/auth.controller.js";
import { verifyUser } from "../middleware/verify.middleware.js";
import { requireRole } from "../middleware/acl.middleware.js";
const authRouter = express.Router();

authRouter.post("/register", registerUser);
authRouter.post("/admin/register", verifyUser, requireRole("OWNER"), adminRegisterUser);
authRouter.post("/login", loginUser);
authRouter.post("/logout", verifyUser, logoutUser);
authRouter.post("/verify", verifyUser, verifyUsers);
authRouter.post("/refresh-token", refreshToken);
authRouter.post("/forget-password", forgetPassword);
authRouter.post("/verify-password-reset", verifyPasswordReset);
authRouter.post("/reset-password", verifyUser, resetPassword);

export default authRouter;
