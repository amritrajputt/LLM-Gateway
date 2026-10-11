import { eq } from "drizzle-orm";
import { db } from "../../index";
import { providers } from "../../db/schema";

export class ProvidersService {
    static async getActiveProviders() {
        return db
            .select({
                id: providers.id,
                name: providers.name,
            })
            .from(providers)
            .where(eq(providers.isActive, true));
    }
}
