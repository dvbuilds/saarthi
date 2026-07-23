import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { handleServerError } from "../utils/handleServerError.js";
import { generateAccessToken, generateRefreshToken, hashToken } from "../utils/generateTokens.js";

const accessTokenOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1000, // 15 min
};

const refreshTokenOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export const register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Fill required fields" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
        })

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshTokenHash = hashToken(refreshToken);
        await user.save();

        res.cookie("accessToken", accessToken, accessTokenOptions);
        res.cookie("refreshToken", refreshToken, refreshTokenOptions);

        return res.status(201).json({ message: "user registered successfully" });

    } catch (error) {
        return handleServerError(res, error, "Couldn't create your account. Please try again.");
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Fill required fields" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User doesn't exists" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid Credentials",
            })
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshTokenHash = hashToken(refreshToken);
        await user.save();

        res.clearCookie(
            "token",
            {
                httpOnly: true,
                secure: true,
                sameSite: "none"
            }
        )

        res.cookie("accessToken", accessToken, accessTokenOptions);
        res.cookie("refreshToken", refreshToken, refreshTokenOptions);

        return res.status(200).json({ message: "user logged-in successfully" });

    } catch (error) {
        return handleServerError(res, error, "Couldn't sign you in. Please try again.");
    }
}

export const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token not found" });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            return res.status(401).json({ message: "Invalid or expired refresh token" });
        }

        const user = await User.findById(decoded.userId);

        if (!user || !user.refreshTokenHash) {
            return res.status(401).json({ message: "Session not found, please login again" });
        }

        const incomingHash = hashToken(refreshToken);

        const isCurrentToken = incomingHash === user.refreshTokenHash;
        const isPreviousToken = incomingHash === user.previousRefreshTokenHash;

        if (!isCurrentToken && !isPreviousToken) {
            // token doesn't match current or previous — possible theft/reuse, kill the session
            user.refreshTokenHash = undefined;
            user.previousRefreshTokenHash = undefined;
            await user.save();
            return res.status(401).json({ message: "Session invalid, please login again" });
        }

        // rotation: issue a fresh pair every time refresh is used
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        user.previousRefreshTokenHash = user.refreshTokenHash;
        user.refreshTokenHash = hashToken(newRefreshToken);
        await user.save();

        res.cookie("accessToken", newAccessToken, accessTokenOptions);
        res.cookie("refreshToken", newRefreshToken, refreshTokenOptions);

        return res.status(200).json({ message: "Token refreshed successfully" });

    } catch (error) {
        return handleServerError(res, error, "Couldn't refresh your session. Please login again.");
    }
}

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                await User.findByIdAndUpdate(decoded.userId, {
                    $unset: { refreshTokenHash: 1, previousRefreshTokenHash: 1 }
                });
            } catch (error) {
                // token already invalid/expired — nothing to clean up in DB
            }
        }

        res.clearCookie(
            "token",
            {
                httpOnly: true,
                secure: true,
                sameSite: "none",
            }
        )
        res.clearCookie("accessToken", accessTokenOptions);
        res.clearCookie("refreshToken", refreshTokenOptions);

        return res.status(200).json({ message: "User logged out successfully" });

    } catch (error) {
        return handleServerError(res, error, "Couldn't log you out. Please try again.");
    }
}

export const getCurrentUser = async (req, res) => {
    try {
        return res.status(200).json({
            user: {
                id: req.user._id,
                fullName: req.user.fullName,
                email: req.user.email,
                avatar: req.user.avatar,
            }
        });
    } catch (error) {
        return handleServerError(res, error, "Couldn't fetch user details.");
    }
}