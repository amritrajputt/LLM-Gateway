ALTER TABLE "keys" RENAME COLUMN "user_id" TO "organisation_id";--> statement-breakpoint
ALTER TABLE "organisations" RENAME COLUMN "email" TO "slug";--> statement-breakpoint
ALTER TABLE "rate_limits" RENAME COLUMN "user_id" TO "organisation_id";--> statement-breakpoint
ALTER TABLE "usage" RENAME COLUMN "user_id" TO "organisation_id";--> statement-breakpoint
ALTER INDEX "rate_limits_user_key_idx" RENAME TO "rate_limits_organisation_key_idx";--> statement-breakpoint
ALTER INDEX "usage_user_created_idx" RENAME TO "usage_organisation_created_idx";--> statement-breakpoint
DROP INDEX "organisations_email_idx";--> statement-breakpoint
ALTER TABLE "keys" DROP CONSTRAINT IF EXISTS "keys_user_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "rate_limits" DROP CONSTRAINT IF EXISTS "rate_limits_user_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "usage" DROP CONSTRAINT IF EXISTS "usage_user_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "keys" ALTER COLUMN "organisation_id" SET DATA TYPE varchar(64) USING "organisation_id"::varchar(64);--> statement-breakpoint
ALTER TABLE "organisations" ALTER COLUMN "id" SET DATA TYPE varchar(64) USING "id"::varchar(64);--> statement-breakpoint
ALTER TABLE "organisations" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "organisations" ALTER COLUMN "slug" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "rate_limits" ALTER COLUMN "organisation_id" SET DATA TYPE varchar(64) USING "organisation_id"::varchar(64);--> statement-breakpoint
ALTER TABLE "usage" ALTER COLUMN "organisation_id" SET DATA TYPE varchar(64) USING "organisation_id"::varchar(64);--> statement-breakpoint
ALTER TABLE "keys" ADD CONSTRAINT "keys_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;