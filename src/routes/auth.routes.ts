import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createAuthLimiter } from "../middleware/rateLimiterMiddleware.js";
import { deleteUser, forgotPassword, getUser, login, logout, refresh, resetPassword, signup, verifyEmail } from "../controllers/authController.js";

const router = express.Router();

const loginLimiter = createAuthLimiter(5);
const signupLimiter = createAuthLimiter(3);
const verifyEmailLimiter = createAuthLimiter(10);
const resetPasswordLimiter = createAuthLimiter(5);
const forgotPasswordLimiter = createAuthLimiter(3);


router.post("/signup", signupLimiter , signup);

router.post("/login", loginLimiter , login);

router.post("/refresh", refresh);

router.post("/logout", logout);

router.post("/verify-email",verifyEmailLimiter , verifyEmail);

router.post("/forgot-password", forgotPasswordLimiter , forgotPassword);

router.post("/reset-password", resetPasswordLimiter , resetPassword);

router.get("/me", authMiddleware, getUser);
router.delete("/me", authMiddleware, deleteUser);
export default router;
