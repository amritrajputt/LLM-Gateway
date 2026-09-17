import { redisClient } from "../../redis/client";

type StoredResponse = {
    state: "processing" | "completed";
    statusCode?: number;
    body?: unknown;
};

export type IdempotencyClaim =
    | { status: "claimed" }
    | { status: "processing" }
    | { status: "completed"; statusCode: number; body: unknown };

export class IdempotencyStore {
    constructor(private readonly ttlSeconds = 300) {}

    private key(scope: string, idempotencyKey: string) {
        return `idempotency:${scope}:${idempotencyKey}`;
    }

    async claim(scope: string, idempotencyKey: string): Promise<IdempotencyClaim> {
        const key = this.key(scope, idempotencyKey);
        const existing = await redisClient.get(key);

        if (existing) {
            const stored = JSON.parse(existing) as StoredResponse;
            const statusCode = stored.statusCode;
            const hasCompletedResponse =
                stored.state === "completed" &&
                statusCode !== undefined &&
                stored.body !== undefined;

            if (hasCompletedResponse) {
                return {
                    status: "completed",
                    statusCode,
                    body: stored.body,
                };
            }
            return { status: "processing" };
        }

        const processingValue = JSON.stringify({ state: "processing" } satisfies StoredResponse);
        const claimed = await redisClient.set(key, processingValue, "EX", this.ttlSeconds, "NX");

        return claimed === "OK" ? { status: "claimed" } : { status: "processing" };
    }

    async complete(
        scope: string,
        idempotencyKey: string,
        statusCode: number,
        body: unknown,
    ) {
        const completedValue = JSON.stringify({
            state: "completed",
            statusCode,
            body,
        } satisfies StoredResponse);

        await redisClient.set(
            this.key(scope, idempotencyKey),
            completedValue,
            "EX",
            this.ttlSeconds,
        );
    }

    async release(scope: string, idempotencyKey: string) {
        await redisClient.del(this.key(scope, idempotencyKey));
    }
}

export const idempotencyStore = new IdempotencyStore();