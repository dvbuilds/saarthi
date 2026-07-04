import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );
};

export const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "30d" }
    );
};

// sha256 instead of bcrypt — bcrypt silently truncates input over 72 bytes,
// and JWTs are longer than that, which would break comparison.
export const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};