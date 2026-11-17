CREATE TABLE "referral" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"shared_build_id" uuid NOT NULL,
	"referred_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_shared_build_id_shared_build_id_fk" FOREIGN KEY ("shared_build_id") REFERENCES "public"."shared_build"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "referral_vendor_index" ON "referral" USING btree ("vendor_id");