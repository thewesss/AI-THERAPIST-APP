import express, { Request, Response } from "express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest";
import { logger } from "./utils/logger";

const app = express();
const PORT = 3001;

app.use(express.json());

app.use("/api/inngest", serve({ client: inngest, functions }));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from the backend!");
});

app.get("/api/chat", (req: Request, res: Response) => {
  res.send( "This is a response from the chat endpoint.");
});

// Start the server
const startServer = async () => {
    try {
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            logger.info(`Server is running on port:${PORT}`);
            logger.info(`Inngest endpoint available at http://localhost:${PORT}/api/inngest`);
        });
    } catch (error) {}
};

// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
