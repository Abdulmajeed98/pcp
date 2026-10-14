ALTER TABLE "part" ADD COLUMN "search_text" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX "part_search_text_index" ON "part" USING gin ("search_text" gin_trgm_ops);