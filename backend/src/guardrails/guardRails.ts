import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { redisClient } from "../redis/client";
import { ApiError } from "../common/errors/ApiError";
import { db } from "../index";
import { keys, organisations } from "../db/schema";
import { and, eq } from "drizzle-orm";

const REQUESTS_PER_SECOND = 10_000;
const RATE_LIMIT_WINDOW_SECONDS = 1;

const piiPatterns: Array<[string, RegExp]> = [
    ["email address", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
    ["phone number", /(?<!\d)(?:\+?\d[\s().-]?){10,14}(?!\d)/],
    ["social security number", /\b\d{3}-\d{2}-\d{4}\b/],
    ["credit card number", /\b(?:\d[ -]*?){13,19}\b/],
];

const promptInjectionPatterns: Array<[string, RegExp]> = [
    ["instruction override", /ignore (?:all |any )?(?:previous|prior|above) instructions/i],
    ["system prompt extraction", /(?:reveal|show|print|give me).{0,40}(?:system prompt|hidden prompt|instructions)/i],
    ["role impersonation", /you are now (?:a|an )?(?:developer|system|jailbreak|unfiltered)/i],
    ["restriction bypass", /(?:bypass|disable|ignore|remove).{0,30}(?:safety|security|guardrail|restriction)/i],
];

function extractPromptText(body: unknown): string {
    if (!body || typeof body !== "object") {
        return "";
    }

    const payload = body as Record<string, unknown>;
    const parts: string[] = [];

    for (const field of ["prompt", "input"]) {
        if (typeof payload[field] === "string") {
            parts.push(payload[field]);
        }
    }

    if (Array.isArray(payload.messages)) {
        for (const message of payload.messages) {
            if (typeof message === "string") {
                parts.push(message);
            } else if (message && typeof message === "object") {
                const content = (message as Record<string, unknown>).content;
                if (typeof content === "string") {
                    parts.push(content);
                } else if (Array.isArray(content)) {
                    for (const part of content) {
                        if (part && typeof part === "object") {
                            const text = (part as Record<string, unknown>).text;
                            if (typeof text === "string") {
                                parts.push(text);
                            }
                        }
                    }
                }
            }
        }
    }

    return parts.join("\n");
}

async function enforceRateLimit(identity: string, res: Response) {
    const second = Math.floor(Date.now() / 1000);
    const key = `guardrails:rate:${identity}:${second}`;
    const count = await redisClient.incr(key);

    if (count === 1) {
        await redisClient.expire(key, RATE_LIMIT_WINDOW_SECONDS);
    }

    res.setHeader("X-RateLimit-Limit", REQUESTS_PER_SECOND);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, REQUESTS_PER_SECOND - count));

    if (count > REQUESTS_PER_SECOND) {
        res.setHeader("Retry-After", RATE_LIMIT_WINDOW_SECONDS);
        throw ApiError.tooManyRequests("Rate limit exceeded");
    }
}

function getProjectName(req: Request): string | undefined {
    const body = req.body as Record<string, unknown> | undefined;
    const project = body?.project ?? req.header("X-Project");
    return typeof project === "string" && project.trim() ? project.trim() : undefined;
}

async function enforceProjectConfiguration(req: Request, organisationId: string) {
    // Key-management routes create the configuration they would otherwise need.
    if (req.path.startsWith("/keys")) {
        return;
    }

    const project = getProjectName(req);
    if (!project) {
        throw ApiError.badRequest("Project is required");
    }

    const [configuredProject] = await db
        .select({ id: keys.id })
        .from(keys)
        .where(and(eq(keys.organisationId, organisationId), eq(keys.project, project)));

    if (!configuredProject) {
        throw ApiError.forbidden("Project is not configured for this organisation");
    }
}

export async function guardRails(req: Request, res: Response, next: NextFunction) {
    try {
        const promptText = extractPromptText(req.body);
        if (!promptText.trim()) {
            return next();
        }

        const { orgId } = getAuth(req);
        if (!orgId) {
            throw ApiError.forbidden("An active organisation is required");
        }

        const [organisation] = await db
            .select({ id: organisations.id })
            .from(organisations)
            .where(eq(organisations.id, orgId));
        if (!organisation) {
            throw ApiError.forbidden("Organisation is not registered");
        }
        req.organisationId = orgId;
        await enforceRateLimit(orgId, res);
        await enforceProjectConfiguration(req, orgId);

        for (const [kind, pattern] of piiPatterns) {
            if (pattern.test(promptText)) {
                throw ApiError.unprocessableEntity(`Potentially sensitive ${kind} detected in prompt`);
            }
        }

        for (const [kind, pattern] of promptInjectionPatterns) {
            if (pattern.test(promptText)) {
                throw ApiError.badRequest(`Potential ${kind} detected in prompt`);
            }
        }

        next();
    } catch (error) {
        if (error instanceof ApiError) {
            next(error);
            return;
        }

        console.error("Guardrail error:", error);
        next(ApiError.serviceUnavailable("Guardrail service is unavailable"));
    }
}
