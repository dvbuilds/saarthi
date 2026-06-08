import express from "express";
import { register, login, logout } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.delete("/logout", protect, logout);

export default router;