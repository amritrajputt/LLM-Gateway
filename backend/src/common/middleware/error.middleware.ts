import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ApiError } from "../errors/ApiError";

export const errorHandler: ErrorRequestHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            statusCode: err.statusCode,
            message: err.message,
        });
    }

    console.error("Unhandled Error:", err);
    return res.status(500).json({
        success: false,
        statusCode: 500,
        message: err.message || "Internal Server Error",
    });
};
