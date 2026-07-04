import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    googleId: {
        type: String,
    },
    avatar: {
        type: String,
    },
    refreshTokenHash: {
        type: String,
    }

}, { timestamps: true })

export const User = mongoose.model("User", userSchema);