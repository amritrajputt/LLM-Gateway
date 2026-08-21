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

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
}));

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
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id").notNull().references(() => providers.id, { onDelete: "restrict" }),
    encryptedApiKey: text("api_keys").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userProviderIdx: uniqueIndex("keys_user_provider_idx").on(table.userId, table.providerId),
}));

export const models = pgTable("models", {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
    modelName: varchar("model_name", { length: 255 }).notNull(), // e.g. "gpt-4o-mini"
    displayName: varchar("display_name", { length: 255 }).notNull(),
    contextLength: integer("context_length").notNull(),
    supportsStreaming: boolean("supports_streaming").notNull().default(false),
    supportsVision: boolean("supports_vision").notNull().default(false),
    supportsFunctionCalling: boolean("supports_function_calling").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    providerModelIdx: uniqueIndex("models_provider_model_idx").on(table.providerId, table.modelName),
}));

export const modelHealth = pgTable("model_health", {
    id: uuid("id").primaryKey().defaultRandom(),
    modelId: uuid("model_id").notNull().references(() => models.id, { onDelete: "cascade" }).unique(),
    healthStatus: healthStatusEnum("health_status").notNull().default("healthy"),
    circuitState: circuitStateEnum("circuit_state").notNull().default("closed"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const modelHistory = pgTable("model_history", {
    id: uuid("id").primaryKey().defaultRandom(),
    modelId: uuid("model_id").notNull().references(() => models.id, { onDelete: "cascade" }),
    taskType: varchar("task_type", { length: 100 }).notNull(),
    complexity: varchar("complexity", { length: 50 }).notNull(),
    totalRequests: integer("total_requests").notNull().default(0),
    goodResponses: integer("good_responses").notNull().default(0),
    avgCost: numeric("avg_cost", { precision: 12, scale: 6 }).notNull().default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    modelTaskComplexityIdx: uniqueIndex("model_history_unique_idx").on(
        table.modelId,
        table.taskType,
        table.complexity
    ),
}));

export const pricing = pgTable("pricing", {
    id: uuid("id").primaryKey().defaultRandom(),
    modelId: uuid("model_id").notNull().references(() => models.id, { onDelete: "cascade" }),
    inputPricePer1kTokens: numeric("input_price_per_1k_tokens", { precision: 10, scale: 6 }).notNull(),
    outputPricePer1kTokens: numeric("output_price_per_1k_tokens", { precision: 10, scale: 6 }).notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull().defaultNow(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }), // null = currently active
}, (table) => ({
    modelEffectiveIdx: index("pricing_model_effective_idx").on(table.modelId, table.effectiveFrom),
}));

export const usage = pgTable("usage", {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: varchar("request_id", { length: 255 }).notNull(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    apiKeyId: uuid("api_key_id").notNull().references(() => keys.id, { onDelete: "restrict" }),
    modelId: uuid("model_id").notNull().references(() => models.id, { onDelete: "restrict" }),
    pricingId: uuid("pricing_id").notNull().references(() => pricing.id, { onDelete: "restrict" }),
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
    userCreatedIdx: index("usage_user_created_idx").on(table.userId, table.createdAt),
    modelCreatedIdx: index("usage_model_created_idx").on(table.modelId, table.createdAt),
    requestIdIdx: uniqueIndex("usage_request_id_idx").on(table.requestId),
}));

export const rateLimits = pgTable("rate_limits", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    apiKeyId: uuid("api_key_id").notNull().references(() => keys.id, { onDelete: "cascade" }),
    requestsPerMinute: integer("requests_per_minute").notNull(),
    tokensPerDay: integer("tokens_per_day").notNull(),
}, (table) => ({
    userKeyIdx: uniqueIndex("rate_limits_user_key_idx").on(table.userId, table.apiKeyId),
}));

export const usersRelations = relations(users, ({ many }) => ({
    keys: many(keys),
    usage: many(usage),
    rateLimits: many(rateLimits),
}));

export const providersRelations = relations(providers, ({ many }) => ({
    models: many(models),
    keys: many(keys),
}));

export const keysRelations = relations(keys, ({ one, many }) => ({
    user: one(users, { fields: [keys.userId], references: [users.id] }),
    provider: one(providers, { fields: [keys.providerId], references: [providers.id] }),
    usage: many(usage),
    rateLimits: many(rateLimits),
}));

export const modelsRelations = relations(models, ({ one, many }) => ({
    provider: one(providers, { fields: [models.providerId], references: [providers.id] }),
    pricing: many(pricing),
    usage: many(usage),
    history: many(modelHistory),
    health: one(modelHealth, { fields: [models.id], references: [modelHealth.modelId] }),
}));

export const modelHealthRelations = relations(modelHealth, ({ one }) => ({
    model: one(models, { fields: [modelHealth.modelId], references: [models.id] }),
}));

export const pricingRelations = relations(pricing, ({ one, many }) => ({
    model: one(models, { fields: [pricing.modelId], references: [models.id] }),
    usage: many(usage),
}));

export const usageRelations = relations(usage, ({ one }) => ({
    user: one(users, { fields: [usage.userId], references: [users.id] }),
    apiKey: one(keys, { fields: [usage.apiKeyId], references: [keys.id] }),
    model: one(models, { fields: [usage.modelId], references: [models.id] }),
    pricing: one(pricing, { fields: [usage.pricingId], references: [pricing.id] }),
}));

export const modelHistoryRelations = relations(modelHistory, ({ one }) => ({
    model: one(models, { fields: [modelHistory.modelId], references: [models.id] }),
}));

export const rateLimitsRelations = relations(rateLimits, ({ one }) => ({
    user: one(users, { fields: [rateLimits.userId], references: [users.id] }),
    apiKey: one(keys, { fields: [rateLimits.apiKeyId], references: [keys.id] }),
}));