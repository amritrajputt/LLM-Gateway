import { db } from "../../index"
import { keys as keysTable } from "../../db/schema"
import { and, eq } from "drizzle-orm"
type CreateKeyInput = {
    organisationId: string;
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
    static async getAllKeys(organisationId: string) {

        const keys = await db.select()
            .from(keysTable)
            .where(eq(keysTable.organisationId, organisationId))
        return keys;
    }
    static async updateKey(input: { id: string; organisationId: string; providerId: string; encryptedApiKey: string; project: string, updatedAt: Date }) {
        const [updatedKey] = await db
            .update(keysTable)
            .set({
                providerId: input.providerId,
                encryptedApiKey: input.encryptedApiKey,
                project: input.project,
                updatedAt: input.updatedAt,
            })
            .where(and(eq(keysTable.id, input.id), eq(keysTable.organisationId, input.organisationId)))
            .returning({
                project: keysTable.project,
                updatedAt: keysTable.updatedAt,
            });
    }
    static async deleteKey(id: string, organisationId: string) {
        const [deletedKey] = await db
            .delete(keysTable)
            .where(and(eq(keysTable.id, id), eq(keysTable.organisationId, organisationId)))
            .returning({ id: keysTable.id })
    }
}