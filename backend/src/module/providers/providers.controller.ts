import type { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../common/responses/ApiResponse";
import { ProvidersService } from "./providers.service";

export class ProvidersController {
    static async list(_req: Request, res: Response, next: NextFunction) {
        try {
            const providers = await ProvidersService.getActiveProviders();
            return res.status(200).json(ApiResponse.ok(providers, "Providers retrieved successfully"));
        } catch (error) {
            return next(error);
        }
    }
}
