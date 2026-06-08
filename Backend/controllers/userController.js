import {User} from "../models/User.js";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";

export const register = async (req, res) => {
    try {
        const {fullName, email, password } = req.body;

        if(!fullName || !email || !password) {
            return res.status(400).json({message : "Fill required fields" });
        }

        const existingUser = await User.findOne({ email });
        if(existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        await User.create({
            fullName,
            email,
            password: hashedPassword,
        })

        return res.status(201).json({ message: "user registered successfully" });

    } catch (error) {
        return res.status(500).json({ message : error.message });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if(!email || !password) {
            return res.status(400).json({ message: "Fill required fields" });
        }

        const user = await User.findOne({ email });
        if(!user) {
            return res.status(400).json({ message: "User doesn't exists" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res.status(400).json({
                message: "Invalid Credentials",
            })
        }

        const token = jwt.sign(
            {
                userId : user._id,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        )

        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.status(200).json({ message: "user logged-in successfully" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const logout = async (req, res) => {
    res.clearCookie("token");

    return res.status(201).json({ message: "User deleted successfully" });
}