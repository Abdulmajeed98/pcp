CREATE TYPE "public"."offer_change" AS ENUM('created', 'changed', 'removed');--> statement-breakpoint
CREATE TABLE "offer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"part_id" uuid NOT NULL,
	"usd_price_cents" integer,
	"iqd_price" integer,
	"in_stock" boolean NOT NULL,
	"warranty_months" integer,
	"confirmed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "offer_vendor_part_unique" UNIQUE("vendor_id","part_id"),
	CONSTRAINT "offer_has_a_price" CHECK ("offer"."usd_price_cents" IS NOT NULL OR "offer"."iqd_price" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "offer_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"vendor_id" uuid NOT NULL,
	"part_id" uuid NOT NULL,
	"change" "offer_change" NOT NULL,
	"usd_price_cents" integer,
	"iqd_price" integer,
	"in_stock" boolean NOT NULL,
	"changed_by" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offer" ADD CONSTRAINT "offer_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer" ADD CONSTRAINT "offer_part_id_part_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."part"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_history" ADD CONSTRAINT "offer_history_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_history" ADD CONSTRAINT "offer_history_part_id_part_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."part"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "offer_history_vendor_part_index" ON "offer_history" USING btree ("vendor_id","part_id","changed_at");