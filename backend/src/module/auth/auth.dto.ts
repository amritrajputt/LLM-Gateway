import * as z from "zod";

const registerSchema = z.object({
    email: z.string().email(),
    name: z.string().min(3).max(50),
});

export default registerSchema;