import { db } from "../../index"
import { users } from "../../db/schema"
import { ApiError } from "../../common/errors/ApiError";
import { eq } from "drizzle-orm";
type RegisterDto = {
    name: string;
    email: string;
};


export class AuthService {
    static async registerService({ name, email }: RegisterDto) {
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));
        
        if (existingUser) {
            throw ApiError.conflict("Email is already in use");
        }
        const [newUser] = await db
            .insert(users)
            .values({ name, email })
            .returning();
        return newUser;
        
    }
}


