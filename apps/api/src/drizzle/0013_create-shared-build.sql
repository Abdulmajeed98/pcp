CREATE TABLE "shared_build" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"part_values" text NOT NULL,
	"shared_at" timestamp with time zone NOT NULL,
	CONSTRAINT "shared_build_part_values_unique" UNIQUE("part_values")
);
