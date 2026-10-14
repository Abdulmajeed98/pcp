CREATE TYPE "public"."part_category" AS ENUM('cpu', 'cpuCooler', 'motherboard', 'ram', 'storage', 'gpu', 'case', 'psu');--> statement-breakpoint
CREATE TABLE "part" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"open_db_id" uuid,
	"category" "part_category" NOT NULL,
	"name" text NOT NULL,
	"manufacturer" text NOT NULL,
	"part_numbers" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "part_open_db_id_unique" UNIQUE("open_db_id")
);
