    import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { handleServerError } from "../utils/handleServerError.js";
import { generateAccessToken, generateRefreshToken, hashToken } from "../utils/generateTokens.js";
import { sendResetPasswordEmail } from "../utils/sendEmail.js";
import { isValidEmail, getEmailError, hasDeliverableDomain, validatePasswordStrength } from "../utils/validators.js";

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
    // Restricting the path means this cookie is only ever transmitted to
    // the refresh endpoint itself — not to every other authenticated
    // request (uploads, generation triggers, etc). A 30-day-lived
    // credential shouldn't travel further than it has to. Setting it here
    // covers every res.cookie()/res.clearCookie() call that reuses this
    // object, so set and clear stay consistent automatically.
    path: "/api/users/refresh",
};

export const register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Fill required fields" });
        }

        // Full signup-time check: format + not a disposable/throwaway
        // domain. (Login uses the lighter isValidEmail() instead — see
        // that function's comment for why.)
        const emailError = getEmailError(email);
        if (emailError) {
            return res.status(400).json({ message: emailError });
        }

        const passwordError = validatePasswordStrength(password);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        // MX/A-record check — catches typo'd or made-up domains
        // ("gmial.com") that pass format validation cleanly. Runs after
        // the existing-user check so a duplicate-email attempt doesn't
        // pay for a DNS round trip it doesn't need. Fails open (see
        // hasDeliverableDomain's comment) so a DNS hiccup never blocks a
        // real signup.
        const deliverable = await hasDeliverableDomain(email);
        if (!deliverable) {
            return res.status(400).json({ message: "We couldn't verify that email domain. Please check for typos or use a different email address." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

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

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Please enter a valid email address." });
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
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { algorithms: ["HS256"] });
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
                const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { algorithms: ["HS256"] });
                await User.findByIdAndUpdate(decoded.userId, {
                    $unset: { refreshTokenHash: 1, previousRefreshTokenHash: 1 }
                });
            } catch (error) {
                // token already invalid/expired — nothing to clean up in DB
            }
        }

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

export const forgotPassword = async (req, res) => {
    // Always return the same generic message whether or not the account
    // exists — prevents this endpoint from being used to check which
    // emails are registered.
    const GENERIC_MESSAGE = "If an account exists for this email, we've sent a password reset link.";

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({ message: GENERIC_MESSAGE });
        }

        const rawToken = crypto.randomBytes(32).toString("hex");

        user.resetTokenHash = hashToken(rawToken);
        user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        try {
            await sendResetPasswordEmail(user.email, rawToken);
        } catch (emailError) {
            // Log the real failure server-side (SMTP misconfig, provider
            // outage, etc) but don't leak it to the client — same generic
            // response either way.
            console.error("[forgotPassword] Failed to send reset email:", emailError.message);
        }

        return res.status(200).json({ message: GENERIC_MESSAGE });

    } catch (error) {
        return handleServerError(res, error, "Couldn't process your request. Please try again.");
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const passwordError = validatePasswordStrength(password);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

        const incomingHash = hashToken(token);

        const user = await User.findOne({
            resetTokenHash: incomingHash,
            resetTokenExpiry: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ message: "This reset link is invalid or has expired. Please request a new one." });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetTokenHash = undefined;
        user.resetTokenExpiry = undefined;

        // Resetting the password kills every existing session — same
        // principle as changing your password anywhere else forcing
        // re-login on all devices.
        user.refreshTokenHash = undefined;
        user.previousRefreshTokenHash = undefined;

        await user.save();

        return res.status(200).json({ message: "Password reset successfully. Please sign in with your new password." });

    } catch (error) {
        return handleServerError(res, error, "Couldn't reset your password. Please try again.");
    }
}
    
