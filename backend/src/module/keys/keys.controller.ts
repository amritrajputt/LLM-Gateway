import express from 'express';
import { ApiError } from '../../common/errors/ApiError';
import { KeysService } from './keys.service';
import { ApiResponse } from '../../common/responses/ApiResponse';
import { encryptApiKey } from '../../common/encryption';

export class KeysController {
    static async createKey(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { keys, userId, providerId, project } = req.body;
            const encryptedKey = encryptApiKey(keys);
            const createdKey = await KeysService.createKey({
                userId,
                providerId,
                encryptedApiKey: JSON.stringify(encryptedKey),
                project,
            });

            return res.status(201).json(ApiResponse.created(createdKey, "Key created successfully"));
        } catch (error) {
            next(error);
        }
    }
    static async getKeys(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const userId: string = req.body;
            const keys = await KeysService.getAllKeys(userId);
            return res.status(200).json(ApiResponse.ok(keys, "Keys retrieved successfully"));
        } catch (error) {
            next(error);
        }
    }
    static async updateKey(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id, keys, providerId, project } = req.body;
            if (!id) {
                throw new ApiError(400, "Key id is required");
                return;
            }
            if (!keys && !providerId && !project) {
                throw new ApiError(400, "Key data is required");
            }
            const encryptedKey = encryptApiKey(keys);
            const updatedKey = await KeysService.updateKey({
                id,
                providerId,
                encryptedApiKey: JSON.stringify(encryptedKey),
                project,
                updatedAt: new Date(),
            });
            return res.status(200).json(ApiResponse.ok(updatedKey, "Key updated successfully"));
        } catch (error) {
            next(error);
        }
    }
    static async deleteKey(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.body;
            if (!id) {
                throw new ApiError(400, "Key id is required");
                return;
            }
            const deletedKey = await KeysService.deleteKey(id);
            return res.status(200).json(ApiResponse.ok(deletedKey, "Key deleted successfully"));
        } catch (error) {
            next(error);
        }
    }

}