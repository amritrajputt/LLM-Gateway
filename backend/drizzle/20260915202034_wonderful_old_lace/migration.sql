DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'keys_user_provider_idx')
	   AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'keys_user_provider_project_idx') THEN
		ALTER INDEX "keys_user_provider_idx" RENAME TO "keys_user_provider_project_idx";
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "keys" ADD COLUMN IF NOT EXISTS "project" varchar(100);--> statement-breakpoint
ALTER TABLE "keys" ALTER COLUMN "project" SET NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "keys_user_provider_project_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "keys_user_provider_project_idx" ON "keys" ("user_id","provider_id","project");