ALTER TABLE "vendor" ADD COLUMN "address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "phone_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "whatsapp_number" text;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "instagram_name" text;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "opening_hours" text;--> statement-breakpoint
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_map_location_whole" CHECK (("vendor"."latitude" IS NULL) = ("vendor"."longitude" IS NULL));