import { integer, pgTable, index, numeric, pgEnum, text, uniqueIndex, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from "drizzle-orm/_relations";

export const authTypeEnum = pgEnum("auth_type", ["bearer", "api_key", "oauth"]);

export const healthStatusEnum = pgEnum("health_status", [
    "healthy",
    "degraded",
    "down",
]);

export const circuitStateEnum = pgEnum("circuit_state", [
    "closed",
    "open",
    "half_open",
]);

export const usageStatusEnum = pgEnum("usage_status", [
    "success",
    "failure",
    "timeout",
    "rate_limited",
]);

export const organisations = pgTable("organisations", {
    id: varchar("id", { length: 64 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

const providerEnum = pgEnum("provider", ["openai", "gemini", "anthropic"])
export const projects = pgTable("projects", {
    id: varchar("id", { length: 65 }).primaryKey(),
    projectName: varchar("project_name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    modelOption: text("model_option").array().notNull().default([]),
    providerId: providerEnum("provider").notNull(),
    slug: varchar("slug", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const providers = pgTable("providers", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    baseUrl: text("base_url").notNull(),
    authType: authTypeEnum("auth_type").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    healthStatus: healthStatusEnum("health_status").notNull().default("healthy"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const keys = pgTable("keys", {
    id: uuid("id").primaryKey().defaultRandom(),
    organisationId: varchar("organisation_id", { length: 64 }).notNull().references(() => organisations.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id").notNull().references(() => providers.id, { onDelete: "restrict" }),
    encryptedApiKey: text("api_keys").notNull(),
    project: varchar("project", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userProviderProjectIdx: uniqueIndex("keys_user_provider_project_idx").on(
        table.organisationId,
        table.providerId,
        table.project,
    ),
}));

export const models = pgTable("models", {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
    modelName: varchar("model_name", { length: 255 }).notNull(), // e.g. "gpt-4o-mini"
    projectId: varchar("project_id", { length: 255 }).notNull().references(() => projects.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    providerModelIdx: uniqueIndex("models_provider_model_idx").on(table.providerId, table.modelName),
}));


export const usage = pgTable("usage", {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: varchar("request_id", { length: 255 }).notNull(),
    organisationId: varchar("organisation_id", { length: 64 }).notNull().references(() => organisations.id, { onDelete: "cascade" }),
    apiKeyId: uuid("api_key_id").notNull().references(() => keys.id, { onDelete: "restrict" }),
    modelId: uuid("model_id").notNull().references(() => models.id, { onDelete: "restrict" }),
    taskType: varchar("task_type", { length: 100 }).notNull(),
    complexity: varchar("complexity", { length: 50 }).notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    cost: numeric("cost", { precision: 12, scale: 6 }).notNull(),
    latencyMs: integer("latency_ms").notNull(),
    judgeScore: numeric("judge_score", { precision: 4, scale: 2 }), // nullable — judge is optional/stretch
    status: usageStatusEnum("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    organisationCreatedIdx: index("usage_organisation_created_idx").on(table.organisationId, table.createdAt),
    modelCreatedIdx: index("usage_model_created_idx").on(table.modelId, table.createdAt),
    requestIdIdx: uniqueIndex("usage_request_id_idx").on(table.requestId),
}));

export const organisationsRelations = relations(organisations, ({ many }) => ({
    keys: many(keys),
    usage: many(usage),
}));

export const providersRelations = relations(providers, ({ many }) => ({
    models: many(models),
    keys: many(keys),
}));

export const keysRelations = relations(keys, ({ one, many }) => ({
    organisation: one(organisations, { fields: [keys.organisationId], references: [organisations.id] }),
    provider: one(providers, { fields: [keys.providerId], references: [providers.id] }),
    usage: many(usage)
}));

export const modelsRelations = relations(models, ({ one, many }) => ({
    provider: one(providers, { fields: [models.providerId], references: [providers.id] }),
    usage: many(usage)
}));


export const usageRelations = relations(usage, ({ one }) => ({
    organisation: one(organisations, { fields: [usage.organisationId], references: [organisations.id] }),
    apiKey: one(keys, { fields: [usage.apiKeyId], references: [keys.id] }),
    model: one(models, { fields: [usage.modelId], references: [models.id] }),
}));
