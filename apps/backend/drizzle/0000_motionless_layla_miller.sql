CREATE TYPE "public"."status" AS ENUM('PENDING', 'UPLOADED', 'QUEUED', 'PROCESSING', 'AI_ANALYZED', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('LOGIN', 'CREATE_ANALYSIS', 'DELETE_ANALYSIS', 'ADMIN_ACTION', 'STATUS_CHANGE', 'FILE_UPLOADED');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('VIDEO', 'AUDIO', 'TEXT');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'USER');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"name" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'USER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"welcome_email_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "status" DEFAULT 'PENDING' NOT NULL,
	"modes" text[] NOT NULL,
	"overall_risk_score" integer,
	"confidence_level" numeric(3, 2),
	"results" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"file_type" "file_type" NOT NULL,
	"file_path" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"model_name" varchar(255) NOT NULL,
	"model_version" varchar(255) NOT NULL,
	"risk_score" integer,
	"confidence" numeric(3, 2),
	"explanation" jsonb,
	"processing_time_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"old_status" "status" NOT NULL,
	"new_status" "status" NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"log_level" text NOT NULL,
	"message" text NOT NULL,
	"details" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"maintenance_mode" boolean DEFAULT false NOT NULL,
	"session_timeout" integer DEFAULT 15 NOT NULL,
	"max_upload_size" integer DEFAULT 100 NOT NULL,
	"analysis_timeout" integer DEFAULT 300 NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"email_alerts_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backups" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"size" varchar(50),
	"file_path" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"retention_days" integer DEFAULT 30,
	"error_message" text
);
--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_runs" ADD CONSTRAINT "model_runs_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_status_history" ADD CONSTRAINT "analysis_status_history_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_logs" ADD CONSTRAINT "analysis_logs_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_logs" ADD CONSTRAINT "analysis_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "analyses_user_id_idx" ON "analyses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analyses_status_idx" ON "analyses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "analyses_created_at_idx" ON "analyses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "files_analysis_id_idx" ON "files" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "files_file_type_idx" ON "files" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX "model_runs_analysis_id_idx" ON "model_runs" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ash_analysis_id_idx" ON "analysis_status_history" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "ash_changed_at_idx" ON "analysis_status_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "analysis_logs_analysis_id_idx" ON "analysis_logs" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "analysis_logs_user_id_idx" ON "analysis_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analysis_logs_log_level_idx" ON "analysis_logs" USING btree ("log_level");--> statement-breakpoint
CREATE INDEX "analysis_logs_timestamp_idx" ON "analysis_logs" USING btree ("timestamp");