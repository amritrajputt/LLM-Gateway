import * as z from "zod";

 export const keysSchema = z.object({
    keys: z.string().min(1).max(200),
});
