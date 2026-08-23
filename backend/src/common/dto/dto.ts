// middleware/validate.ts
import * as z from "zod"
import type{ Request, Response, NextFunction } from "express";

const validate = (schema: z.ZodSchema) => {
    return (req:Request, res:Response, next:NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return res.status(422).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }

        req.body = result.data;
        next();
    };
};