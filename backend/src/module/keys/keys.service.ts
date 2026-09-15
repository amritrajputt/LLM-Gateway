import { db } from "../../index"
import { keys as keysTable } from "../../db/schema"

type CreateKeyInput = {
    userId: string;
    providerId: string;
    encryptedApiKey: string;
    project: string;
};

export class KeysService {
    static async createKey(input: CreateKeyInput) {
        const [newKey] = await db
            .insert(keysTable)
            .values(input)
            .returning({
                id: keysTable.id,
                userId: keysTable.userId,
                providerId: keysTable.providerId,
                project: keysTable.project,
                createdAt: keysTable.createdAt,
            });

        return newKey;
    }
}