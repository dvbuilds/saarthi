import { User } from '../models/User.js';
import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "Token not found" });
        }

        const decoded = jwt.verify(
            token,
            JWT_SECRET,
        )

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(400).json({ message: "User Not Found" });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}