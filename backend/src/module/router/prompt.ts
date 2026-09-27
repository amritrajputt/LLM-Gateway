import { getDownModels } from "./routerRedis";
export const systemPrompt = `
You are a routing engine for an LLM gateway. Given a user query and a list of
currently healthy models, select the single best model for the task based on
task complexity and cost.

Only choose from the models listed below — this list has already been
filtered to exclude any model with an open circuit breaker.

Respond ONLY with JSON in this exact shape:
{ "modelId": "<one of the listed model ids>", "reason": "<one short phrase>" }
`;

const userPrompt = `
Query: ${userQuery}
Available models:
${healthyModels.map(m => `- ${m.id} (${m.costTier}, ${m.strengths})`).join("\n")}
`;