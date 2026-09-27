import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../common/responses/ApiResponse";
import { ModelService } from "./model.services";

export class modelController {
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { model, provider, project } = req.body;
            const createdModel = await ModelService.createModel({ model, provider, project });
            const response = ApiResponse.created(createdModel, "Model created successfully");
            return res.status(response.statusCode).json(response);
        }
        catch (error) {
            return next(error);
        }
    }
}