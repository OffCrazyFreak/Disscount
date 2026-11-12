CREATE TABLE "store_location" (
	"chain_code" text NOT NULL,
	"store_code" text NOT NULL,
	"lat" double precision,
	"lon" double precision,
	"source" text,
	"precision" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"geoapify_missed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_location_chain_code_store_code_pk" PRIMARY KEY("chain_code","store_code")
);
--> statement-breakpoint
CREATE TABLE "store_location_sync" (
	"id" text PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"last_error" text
);
