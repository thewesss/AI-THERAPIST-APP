import { Request, Response, NextFunction } from "express";
import { Activity } from "../models/Activity";
import { logger } from "../utils/logger";

// Allowed enum values from your schema
const allowedTypes = ["meditation", "exercise", "walking", "reading", "journaling", "therapy"];

export const logActivity = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { type, name, description, duration, difficulty, feedback } = req.body;

        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: "User is not authenticated" });
        }

        // Validate enum type
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({ 
                message: `Invalid activity type. Allowed types: ${allowedTypes.join(", ")}` 
            });
        }

        // Ensure duration is a number
        const durationNumber = Number(duration);
        if (isNaN(durationNumber)) {
            return res.status(400).json({ message: "Duration must be a number in minutes" });
        }

        const activity = new Activity({
            userId, // set userId
            type,
            name,
            description,
            duration: durationNumber,
            difficulty,
            feedback,
            timestamp: new Date(),
        });

        await activity.save();
        logger.info(`Activity logged for user: ${userId}`);

        res.status(201).json({
            success: true,
            data: activity,
        });
    } catch (error) {
        logger.error("Error logging activity:", error);
        next(error);
    }
};


