import express from 'express';
import { ApiError } from '../../common/errors/ApiError';
import { KeysService } from './keys.service';
import { ApiResponse } from '../../common/responses/ApiResponse';
import { encryptApiKey } from '../../common/encryption';
import { idempotencyStore } from '../../common/idempotency/IdempotencyStore';

export class KeysController {
    static async createKey(req: express.Request, res: express.Response, next: express.NextFunction) {
        let claimedRequestKey: string | undefined;

        try {
            const { keys, userId, providerId, project } = req.body;
            const idempotencyKey = req.header('Idempotency-Key');
            if (!idempotencyKey) {
                throw new ApiError(400, 'Idempotency-Key header is required');
            }

            const requestKey = `${userId}:${idempotencyKey}`;
            const claim = await idempotencyStore.claim('keys:create', requestKey);
            if (claim.status === 'completed') {
                return res.status(claim.statusCode).json(claim.body);
            }
            if (claim.status === 'processing') {
                throw new ApiError(409, 'A request with this idempotency key is already in progress');
            }
            claimedRequestKey = requestKey;

            const encryptedKey = encryptApiKey(keys);
            const createdKey = await KeysService.createKey({
                userId,
                providerId,
                encryptedApiKey: JSON.stringify(encryptedKey),
                project,
            });

            const response = ApiResponse.created(createdKey, "Key created successfully");
            await idempotencyStore.complete('keys:create', requestKey, response.statusCode, response);
            return res.status(response.statusCode).json(response);
        } catch (error) {
            if (claimedRequestKey) {
                await idempotencyStore.release('keys:create', claimedRequestKey);
            }
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
        let claimedRequestKey: string | undefined;

        try {
            const { id, keys, providerId, project } = req.body;
            if (!id) {
                throw new ApiError(400, "Key id is required");
                return;
            }
            if (!keys && !providerId && !project) {
                throw new ApiError(400, "Key data is required");
            }

            const idempotencyKey = req.header('Idempotency-Key');
            if (!idempotencyKey) {
                throw new ApiError(400, 'Idempotency-Key header is required');
            }

            const requestKey = `${id}:${idempotencyKey}`;
            const claim = await idempotencyStore.claim('keys:update', requestKey);
            if (claim.status === 'completed') {
                return res.status(claim.statusCode).json(claim.body);
            }
            if (claim.status === 'processing') {
                throw new ApiError(409, 'A request with this idempotency key is already in progress');
            }
            claimedRequestKey = requestKey;

            const encryptedKey = encryptApiKey(keys);
            const updatedKey = await KeysService.updateKey({
                id,
                providerId,
                encryptedApiKey: JSON.stringify(encryptedKey),
                project,
                updatedAt: new Date(),
            });

            const response = ApiResponse.ok(updatedKey, "Key updated successfully");
            await idempotencyStore.complete('keys:update', requestKey, response.statusCode, response);
            return res.status(response.statusCode).json(response);
        } catch (error) {
            if (claimedRequestKey) {
                await idempotencyStore.release('keys:update', claimedRequestKey);
            }
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