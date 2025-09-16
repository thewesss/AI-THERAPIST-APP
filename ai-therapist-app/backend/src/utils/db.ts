import mongoose from "mongoose"; //provides it a way to define the structure of the app's data and makes it easier to work with mongodb.
import { logger } from "./logger";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://wesleymutyambizi_db_user:OXGtbCxmQ4nyW5gH@ai-therapist-agent.7t6s7qs.mongodb.net/?retryWrites=true&w=majority&appName=ai-therapist-agent"

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        logger.info("Connected to MongoDB Atlas");

    } catch (error) {
        logger.error("Error connecting to MongoDB Atlas:", error);
        process.exit(1); // Exit the process with a failure code
    }
};
