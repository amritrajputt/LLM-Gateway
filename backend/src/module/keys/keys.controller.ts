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
}
