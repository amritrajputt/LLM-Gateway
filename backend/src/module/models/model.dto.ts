import { z } from "zod";

export const modelSchema = z.object({
   model: z.string().min(1).max(255),
   provider: z.string().min(1),
   project: z.string().min(1),
});