import express, { Request, Response } from "express";
import { serve } from "inngest/express";
import { inngest } from "./inngest/index";
import { functions as inngestFunctions } from "./inngest/functions";
import { logger } from "./utils/logger";
import { connectDB } from "./utils/db";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

// Create an Express application
const app = express();
const PORT = 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Inngest endpoint to handle events
app.use("/api/inngest", serve({ client: inngest, functions: inngestFunctions }));

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
