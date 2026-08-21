import { integer, pgTable, varchar,timestamp } from 'drizzle-orm/pg-core';

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp('timestamp1').notNull().defaultNow(),
  updatedAt: timestamp('timestamp1').notNull().defaultNow()
});
