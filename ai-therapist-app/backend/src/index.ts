import 'dotenv/config';       // MUST be first
import dotenv from "dotenv";   
dotenv.config();               //  ensures env is loaded

import express, { Request, Response } from "express";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client"; // ← now env is available
import { functions as inngestFunctions } from "./inngest/functions";
import { logger } from "./utils/logger";
import { connectDB } from "./utils/db";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth";
import { errorHandler } from "./middleware/errorHandler";
import chatRouter from "./routes/chat";
import moodRouter from "./routes/mood";
import activityRouter from "./routes/activity";


if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in .env');
}


// Create an Express application
const app = express();


// Middleware setup
app.use(cors())// Allow cross-origin requests
app.use(helmet())// Secure HTTP headers
app.use(morgan("dev"))// HTTP request logging

// Middleware to parse JSON bodies
app.use(express.json());

// routes
app.use("/auth", authRoutes);
app.use("/chat", chatRouter);
app.use("/api/mood", moodRouter);
app.use("/api/activity", activityRouter);

// Inngest endpoint to handle events
app.use("/api/inngest", serve({ client: inngest, functions: inngestFunctions }));

//error handling middleware
app.use(errorHandler);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from the backend!");
});

app.get("/api/chat", (req: Request, res: Response) => {
  res.send( "This is a response from the chat endpoint.");
});

// Start the server
const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            // Log server start message using the logger
            logger.info(`Server is running on port:${PORT}`);
            logger.info(`Inngest endpoint available at http://localhost:${PORT}/api/inngest`);
        });
        
    } catch (error) {
        // Handle any errors that occur during server startup
        logger.error("Error starting server:", error);
        process.exit(1); // Exit the process with a failure code
    }
};

startServer();
