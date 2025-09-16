import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

// Extend the Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

// Middleware to authenticate requests using JWT
export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ message: "Authorization required" });
        }
//verify token
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || "your-secret-key"
        ) as any;
        //find user
        const user = await User.findById(decoded.userId);

        if (!user){
            return res.status(401).json({ message: "User not found" });
        } 

        req.user = user; //attach user to request object
        next(); //proceed to the next middleware or route handler
    } catch (error) {
        res.status(401).json({ message: "Invalid token"});
    }
}