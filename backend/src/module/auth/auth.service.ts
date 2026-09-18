import { db } from "../../index"
import { organisations } from "../../db/schema"
type OrganisationInput = {
    id: string;
    name: string;
    slug?: string;
};


export class AuthService {
    static async syncOrganisation({ id, name, slug }: OrganisationInput) {
        const [organisation] = await db
            .insert(organisations)
            .values({ id, name, slug })
            .onConflictDoUpdate({
                target: organisations.id,
                set: { name, slug, updatedAt: new Date() },
            })
            .returning();
        return organisation;

    }
}


