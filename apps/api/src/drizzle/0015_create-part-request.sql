CREATE TYPE "public"."part_request_state" AS ENUM('open', 'fulfilled', 'rejected');--> statement-breakpoint
CREATE TABLE "part_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"category" "part_category" NOT NULL,
	"name" text NOT NULL,
	"part_number" text NOT NULL,
	"usd_price_cents" integer,
	"iqd_price" integer,
	"in_stock" boolean NOT NULL,
	"warranty_months" integer,
	"sent_at" timestamp with time zone NOT NULL,
	"state" "part_request_state" NOT NULL,
	"part_id" uuid,
	"reason" text,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "part_request_has_a_price" CHECK ("part_request"."usd_price_cents" IS NOT NULL OR "part_request"."iqd_price" IS NOT NULL),
	CONSTRAINT "part_request_open_is_unresolved" CHECK ("part_request"."state" <> 'open' OR ("part_request"."part_id" IS NULL AND "part_request"."reason" IS NULL AND "part_request"."resolved_at" IS NULL)),
	CONSTRAINT "part_request_fulfilled_has_its_part" CHECK ("part_request"."state" <> 'fulfilled' OR ("part_request"."part_id" IS NOT NULL AND "part_request"."reason" IS NULL AND "part_request"."resolved_at" IS NOT NULL)),
	CONSTRAINT "part_request_rejected_has_its_reason" CHECK ("part_request"."state" <> 'rejected' OR ("part_request"."reason" IS NOT NULL AND "part_request"."part_id" IS NULL AND "part_request"."resolved_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "part_request" ADD CONSTRAINT "part_request_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_request" ADD CONSTRAINT "part_request_part_id_part_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."part"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "part_request_state_sent_index" ON "part_request" USING btree ("state","sent_at");--> statement-breakpoint
CREATE INDEX "part_request_vendor_sent_index" ON "part_request" USING btree ("vendor_id","sent_at");