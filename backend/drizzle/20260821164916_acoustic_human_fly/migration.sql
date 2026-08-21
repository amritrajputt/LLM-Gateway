CREATE TYPE "auth_type" AS ENUM('bearer', 'api_key', 'oauth');--> statement-breakpoint
CREATE TYPE "circuit_state" AS ENUM('closed', 'open', 'half_open');--> statement-breakpoint
CREATE TYPE "health_status" AS ENUM('healthy', 'degraded', 'down');--> statement-breakpoint
CREATE TYPE "usage_status" AS ENUM('success', 'failure', 'timeout', 'rate_limited');--> statement-breakpoint
CREATE TABLE "keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"api_keys" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_health" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"model_id" uuid NOT NULL UNIQUE,
	"health_status" "health_status" DEFAULT 'healthy'::"health_status" NOT NULL,
	"circuit_state" "circuit_state" DEFAULT 'closed'::"circuit_state" NOT NULL,
	"last_checked_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"model_id" uuid NOT NULL,
	"task_type" varchar(100) NOT NULL,
	"complexity" varchar(50) NOT NULL,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"good_responses" integer DEFAULT 0 NOT NULL,
	"avg_cost" numeric(12,6) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"provider_id" uuid NOT NULL,
	"model_name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"context_length" integer NOT NULL,
	"supports_streaming" boolean DEFAULT false NOT NULL,
	"supports_vision" boolean DEFAULT false NOT NULL,
	"supports_function_calling" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"model_id" uuid NOT NULL,
	"input_price_per_1k_tokens" numeric(10,6) NOT NULL,
	"output_price_per_1k_tokens" numeric(10,6) NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL UNIQUE,
	"base_url" text NOT NULL,
	"auth_type" "auth_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"health_status" "health_status" DEFAULT 'healthy'::"health_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"api_key_id" uuid NOT NULL,
	"requests_per_minute" integer NOT NULL,
	"tokens_per_day" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"request_id" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"api_key_id" uuid NOT NULL,
	"model_id" uuid NOT NULL,
	"pricing_id" uuid NOT NULL,
	"task_type" varchar(100) NOT NULL,
	"complexity" varchar(50) NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"cost" numeric(12,6) NOT NULL,
	"latency_ms" integer NOT NULL,
	"judge_score" numeric(4,2),
	"status" "usage_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_key";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP IDENTITY IF EXISTS;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
CREATE UNIQUE INDEX "keys_user_provider_idx" ON "keys" ("user_id","provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "model_history_unique_idx" ON "model_history" ("model_id","task_type","complexity");--> statement-breakpoint
CREATE UNIQUE INDEX "models_provider_model_idx" ON "models" ("provider_id","model_name");--> statement-breakpoint
CREATE INDEX "pricing_model_effective_idx" ON "pricing" ("model_id","effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limits_user_key_idx" ON "rate_limits" ("user_id","api_key_id");--> statement-breakpoint
CREATE INDEX "usage_user_created_idx" ON "usage" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "usage_model_created_idx" ON "usage" ("model_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_request_id_idx" ON "usage" ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");--> statement-breakpoint
ALTER TABLE "keys" ADD CONSTRAINT "keys_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "keys" ADD CONSTRAINT "keys_provider_id_providers_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "model_health" ADD CONSTRAINT "model_health_model_id_models_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "model_history" ADD CONSTRAINT "model_history_model_id_models_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_provider_id_providers_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pricing" ADD CONSTRAINT "pricing_model_id_models_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_api_key_id_keys_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "keys"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_api_key_id_keys_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "keys"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_model_id_models_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_pricing_id_pricing_id_fkey" FOREIGN KEY ("pricing_id") REFERENCES "pricing"("id") ON DELETE RESTRICT;