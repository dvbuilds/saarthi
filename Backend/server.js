import dotenv from "dotenv";
import express from "express";
import connectDB from "./connect/db.js"
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.json({ message: "Server is running"});
} )

app.listen(process.env.PORT, () => {
    console.log(`Server is running at PORT ${process.env.PORT}`);
});