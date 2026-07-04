import express from "express";
import { register, login, logout, refreshAccessToken } from "../controllers/userController.js";
import {protect} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.delete("/logout", protect, logout);
router.post("/refresh", refreshAccessToken);

export default router;