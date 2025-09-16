import { Request, Response } from "express";
import { User } from "../models/User";
import { Session } from "../models/Session";
import bcrypt from "bcrypt"; // for hashing passwords
import jwt from "jsonwebtoken"; // for generating tokens

//register a new user
export const register = async (req: Request, res: Response) => {
    try{
        const { name, email, password } = req.body;
        //validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }

        //check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }
        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        //create new user
        const user = new User({ name, email, password: hashedPassword });
        await user.save(); //save user to database

        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            message: "User registered successfully.",
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

//login user
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        //validation
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }
        //check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email" });
        }

        //verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password." });
        }

        //generate JWT token
        const token = jwt.sign(
            {userId: user.id },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "24h" }
        );

        //create new session
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); //session expires in 24 hours

        const session = new Session({
            userId: user._id,
            token,
            expiresAt,
            deviceInfo: req.headers["user-agent"],
        });
        await session.save(); //save session to database
//return user and token
        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            token,
            message: "Login successful.",
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

//logout user
export const logout = async (req: Request, res: Response) => {
    try {
        // find and delete the session based on the token
        const token = req.header("Authorization")?.replace("Bearer ", "");//get token from header
        if (!token) {// if no token provided
            await Session.deleteOne({ token });//delete session from database
        }
        res.json({ message: "Logout successful." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};