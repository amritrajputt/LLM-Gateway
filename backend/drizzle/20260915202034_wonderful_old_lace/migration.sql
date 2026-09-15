ALTER INDEX "keys_user_provider_idx" RENAME TO "keys_user_provider_project_idx";--> statement-breakpoint
ALTER TABLE "keys" ADD COLUMN "project" varchar(100) NOT NULL;--> statement-breakpoint
DROP INDEX "keys_user_provider_project_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "keys_user_provider_project_idx" ON "keys" ("user_id","provider_id","project");