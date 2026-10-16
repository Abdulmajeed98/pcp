CREATE TYPE "public"."vendor_city" AS ENUM('erbil');--> statement-breakpoint
CREATE TABLE "vendor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"city" "vendor_city" NOT NULL,
	"login_phone_number" text NOT NULL,
	"login_id" uuid NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_login_phone_number_unique" UNIQUE("login_phone_number"),
	CONSTRAINT "vendor_login_id_unique" UNIQUE("login_id")
);
