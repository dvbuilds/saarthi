import { User } from '../models/User.js';
import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;

        if (!token) {
            return res.status(401).json({ message: "Access token not found" });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
        )

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;

        next();
    } catch (error) {
        // 401, not 500 — an expired/invalid access token is a normal case the
        // frontend needs to catch and respond to by calling /refresh
        return res.status(401).json({ message: "Invalid or expired access token" });
    }
}