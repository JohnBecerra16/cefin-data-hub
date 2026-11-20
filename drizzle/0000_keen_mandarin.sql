CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(120) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brands_code_unique" UNIQUE("code"),
	CONSTRAINT "brands_code_format" CHECK ("brands"."code" ~ '^[a-z0-9][a-z0-9-]{0,49}$')
);
--> statement-breakpoint
CREATE TABLE "contact_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"granted" boolean NOT NULL,
	"privacy_notice_version" varchar(50) NOT NULL,
	"evidence" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_consents_purpose_check" CHECK ("contact_consents"."purpose" in ('class_registration', 'marketing'))
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"email_original" varchar(254) NOT NULL,
	"email_normalized" varchar(254) NOT NULL,
	"phone_e164" varchar(16),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contacts_brand_id_id_unique" UNIQUE("brand_id","id"),
	CONSTRAINT "contacts_email_normalized_lower" CHECK ("contacts"."email_normalized" = lower(btrim("contacts"."email_normalized"))),
	CONSTRAINT "contacts_phone_e164_format" CHECK ("contacts"."phone_e164" is null or "contacts"."phone_e164" ~ '^\+[1-9][0-9]{1,14}$')
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"key_hash" varchar(64) PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rate_limit_buckets_hash_format" CHECK ("rate_limit_buckets"."key_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "rate_limit_buckets_count_nonnegative" CHECK ("rate_limit_buckets"."count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "registration_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"brand_id" uuid,
	"event_id" uuid,
	"result" varchar(16) NOT NULL,
	"error_code" varchar(60),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registration_attempts_result_check" CHECK ("registration_attempts"."result" in ('accepted', 'rejected', 'failed', 'rate_limited')),
	CONSTRAINT "registration_attempts_event_requires_brand" CHECK ("registration_attempts"."event_id" is null or "registration_attempts"."brand_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "registration_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"status" varchar(12) DEFAULT 'draft' NOT NULL,
	"whatsapp_url" varchar(2048),
	"privacy_notice_version" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registration_events_brand_id_id_unique" UNIQUE("brand_id","id"),
	CONSTRAINT "registration_events_status_check" CHECK ("registration_events"."status" in ('draft', 'active', 'closed')),
	CONSTRAINT "registration_events_slug_format" CHECK ("registration_events"."slug" ~ '^[a-z0-9][a-z0-9-]{0,99}$'),
	CONSTRAINT "registration_events_whatsapp_invite" CHECK ("registration_events"."whatsapp_url" is null or "registration_events"."whatsapp_url" ~ '^https://chat\.whatsapp\.com/[A-Za-z0-9_-]+/?$')
);
--> statement-breakpoint
CREATE TABLE "registration_requests" (
	"brand_id" uuid NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"response" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registration_requests_brand_key_pk" PRIMARY KEY("brand_id","idempotency_key"),
	CONSTRAINT "registration_requests_hash_format" CHECK ("registration_requests"."request_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"source" varchar(200),
	"medium" varchar(200),
	"campaign" varchar(200),
	"utm_source" varchar(200),
	"utm_medium" varchar(200),
	"utm_campaign" varchar(200),
	"utm_term" varchar(200),
	"utm_content" varchar(200),
	"landing_url" varchar(2048),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registrations_brand_id_id_contact_id_unique" UNIQUE("brand_id","id","contact_id")
);
--> statement-breakpoint
ALTER TABLE "contact_consents" ADD CONSTRAINT "contact_consents_registration_contact_fk" FOREIGN KEY ("brand_id","registration_id","contact_id") REFERENCES "public"."registrations"("brand_id","id","contact_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_attempts" ADD CONSTRAINT "registration_attempts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_attempts" ADD CONSTRAINT "registration_attempts_event_brand_fk" FOREIGN KEY ("brand_id","event_id") REFERENCES "public"."registration_events"("brand_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_events" ADD CONSTRAINT "registration_events_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_contact_brand_fk" FOREIGN KEY ("brand_id","contact_id") REFERENCES "public"."contacts"("brand_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_brand_fk" FOREIGN KEY ("brand_id","event_id") REFERENCES "public"."registration_events"("brand_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_consents_brand_contact_created_idx" ON "contact_consents" USING btree ("brand_id","contact_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_brand_email_unique" ON "contacts" USING btree ("brand_id","email_normalized");--> statement-breakpoint
CREATE INDEX "contacts_brand_created_at_idx" ON "contacts" USING btree ("brand_id","created_at");--> statement-breakpoint
CREATE INDEX "rate_limit_buckets_expires_at_idx" ON "rate_limit_buckets" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "registration_attempts_created_at_idx" ON "registration_attempts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "registration_attempts_request_id_idx" ON "registration_attempts" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_events_brand_slug_unique" ON "registration_events" USING btree ("brand_id","slug");--> statement-breakpoint
CREATE INDEX "registration_events_brand_status_idx" ON "registration_events" USING btree ("brand_id","status");--> statement-breakpoint
CREATE INDEX "registration_requests_expires_at_idx" ON "registration_requests" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_contact_event_unique" ON "registrations" USING btree ("brand_id","contact_id","event_id");--> statement-breakpoint
CREATE INDEX "registrations_brand_event_created_idx" ON "registrations" USING btree ("brand_id","event_id","created_at");--> statement-breakpoint
CREATE INDEX "registrations_brand_created_idx" ON "registrations" USING btree ("brand_id","created_at");
