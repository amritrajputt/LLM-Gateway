import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { ApiResponse } from "../../common/responses/ApiResponse";

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const payload = req.body || {};
            const eventType = payload?.type;
            const data = payload?.data || payload;

            if (eventType && !["organization.created", "organization.updated"].includes(eventType)) {
                return res.status(200).json({
                    success: true,
                    message: `Event '${eventType}' received and acknowledged`,
                });
            }

            if (!data?.id) {
                return res.status(200).json({
                    success: true,
                    message: "Organisation webhook acknowledged, no organisation id present",
                });
            }

            const organisation = await AuthService.syncOrganisation({
                id: data.id,
                name: data.name || data.slug || data.id,
                slug: data.slug,
            });
            const response = ApiResponse.ok(organisation, "Organisation synchronized successfully");
            return res.status(response.statusCode).json(response);
        } catch (err) {
            next(err);
        }
    }
}