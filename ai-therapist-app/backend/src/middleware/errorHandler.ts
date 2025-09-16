import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

// Custom error handling middleware giving more information about errors
export class AppError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;

    // Constructor for the AppError class
    constructor(message: string, statusCode: number) {
        super(message); // Call the parent class (Error) constructor with the message
        this.statusCode = statusCode;// Set the HTTP status code
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";// Determine if it's a client or server error
        this.isOperational = true;// Mark this error as operational (trusted)

        Error.captureStackTrace(this, this.constructor);// Capture the stack trace for debugging
    }
}

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }

    logger.error("Unexpected error:", err);// Log unexpected errors for debugging
 
    // For unexpected errors, send a generic message
    return res.status(500).json({
        status: "error",
        message: "Something went wrong!",
    });
}