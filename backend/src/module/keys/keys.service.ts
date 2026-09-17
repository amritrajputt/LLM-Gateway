import { db } from "../../index"
import { keys as keysTable } from "../../db/schema"
import { eq } from "drizzle-orm"
type CreateKeyInput = {
    userId: string;
    providerId: string;
    encryptedApiKey: string;
    project: string;
};
type UpdateKeyInput = {
    id: string;
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
                project: keysTable.project,
                createdAt: keysTable.createdAt,
            });

        return newKey;
    }
    static async getAllKeys(userId: string) {

        const keys = await db.select()
            .from(keysTable)
            .where(eq(keysTable.userId, userId))
        return keys;
    }
    static async updateKey(input: { id: string; providerId: string; encryptedApiKey: string; project: string, updatedAt: Date }) {
        const [updatedKey] = await db
            .update(keysTable)
            .set({
                providerId: input.providerId,
                encryptedApiKey: input.encryptedApiKey,
                project: input.project,
                updatedAt: input.updatedAt,
            })
            .returning({
                project: keysTable.project,
                updatedAt: keysTable.updatedAt,
            });
    }
    static async deleteKey(id: string) {
        const [deletedKey] = await db
            .delete(keysTable)
            .where(eq(keysTable.id, id))
            .returning({ id: keysTable.id })
    }
}