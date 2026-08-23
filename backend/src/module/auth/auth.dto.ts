import * as z from "zod";

 export const registerSchema = z.object({
    email: z.string().email(),
    name: z.string().min(3).max(50),
});

  