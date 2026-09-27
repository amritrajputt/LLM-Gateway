import { eq } from "drizzle-orm";
import { db } from "../../index";
import { models, providers, projects } from "../../db/schema";
import { ApiError } from "../../common/errors/ApiError";

type CreateModelInput = {
    model: string;
    provider: string;
    project: string;
};

export class ModelService {
    static async createModel({ model, provider, project }: CreateModelInput) {
        const [providerRow] = await db
            .select({ id: providers.id })
            .from(providers)
            .where(eq(providers.name, provider))
            .limit(1);

        if (!providerRow) {
            throw ApiError.notFound(`Provider "${provider}" not found`);
        }

        const [projectRow] = await db
            .select({ id: projects.id })
            .from(projects)
            .where(eq(projects.projectName, project))
            .limit(1);

        if (!projectRow) {
            throw ApiError.notFound(`Project "${project}" not found`);
        }

        const [createdModel] = await db
            .insert(models)
            .values({
                modelName: model,
                providerId: providerRow.id,
                projectId: projectRow.id,
            })
            .returning();

        return createdModel;
    }
}
