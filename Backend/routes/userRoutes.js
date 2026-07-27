import express from "express";
import { register, login, logout, refreshAccessToken, getCurrentUser, forgotPassword, resetPassword } from "../controllers/userController.js";
import {protect} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", protect, logout);
router.get("/me" , protect, getCurrentUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;