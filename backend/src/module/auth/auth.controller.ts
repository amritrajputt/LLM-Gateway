import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { ApiResponse } from "../../common/responses/ApiResponse";
import { ApiError } from "../../common/errors/ApiError";

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const payload = req.body || {};
            const eventType = payload?.type;
            const data = payload?.data || payload;

            if (eventType && eventType !== "user.created") {
                return res.status(200).json({
                    success: true,
                    message: `Event '${eventType}' received and acknowledged`,
                });
            }

            const email: string | undefined =
                data?.email_addresses?.[0]?.email_address || payload?.email;

            const firstName: string =
                payload?.first_name;

            const lastName: string =
                payload?.last_name;

            const name: string = firstName + " " + lastName;

            if (!email) {
                console.warn("No email found in payload, returning 200 OK acknowledgment:", payload);
                return res.status(200).json({
                    success: true,
                    message: "Webhook payload acknowledged, no user email present",
                });
            }

            const newUser = await AuthService.registerService({ name, email });
            const response = ApiResponse.created(newUser, "User registered successfully");
            console.log("User registered successfully:", newUser);
            return res.status(response.statusCode).json(response);
        } catch (err) {
            next(err);
        }
    }
}