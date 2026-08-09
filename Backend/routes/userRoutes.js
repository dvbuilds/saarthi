import express from "express";
import { register, login, logout, refreshAccessToken, getCurrentUser, forgotPassword, resetPassword } from "../controllers/userController.js";
import {protect} from "../middlewares/authMiddleware.js";
import { authLimiter } from "../middlewares/authRateLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", protect, logout);
router.get("/me" , protect, getCurrentUser);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);

export default router;