CREATE TABLE "platform_rate" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "platform_rate_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"iqd_per_usd" integer NOT NULL,
	"set_at" timestamp with time zone NOT NULL,
	"set_by" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "platform_rate_set_at_index" ON "platform_rate" USING btree ("set_at","id");