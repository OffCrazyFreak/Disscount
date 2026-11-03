CREATE TABLE "store_hours" (
	"chain_code" text NOT NULL,
	"store_code" text NOT NULL,
	"weekly" jsonb NOT NULL,
	"exceptions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sundays" text DEFAULT 'dated' NOT NULL,
	"source" text NOT NULL,
	"check_url" text,
	"verified_at" timestamp with time zone NOT NULL,
	"link_status" text,
	"link_checked_at" timestamp with time zone,
	"link_failures" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "store_hours_chain_code_store_code_pk" PRIMARY KEY("chain_code","store_code")
);
--> statement-breakpoint
CREATE TABLE "store_hours_overlay" (
	"chain_code" text NOT NULL,
	"store_code" text DEFAULT '' NOT NULL,
	"date" date NOT NULL,
	"ranges" jsonb NOT NULL,
	"source" text NOT NULL,
	"verified_at" timestamp with time zone NOT NULL,
	CONSTRAINT "store_hours_overlay_chain_code_store_code_date_pk" PRIMARY KEY("chain_code","store_code","date")
);
--> statement-breakpoint
CREATE TABLE "store_hours_run" (
	"job" text NOT NULL,
	"chain_code" text NOT NULL,
	"accepted_count" integer,
	"accepted_at" timestamp with time zone,
	"last_count" integer,
	"last_status" text NOT NULL,
	"last_error" text,
	"last_run_at" timestamp with time zone NOT NULL,
	CONSTRAINT "store_hours_run_job_chain_code_pk" PRIMARY KEY("job","chain_code")
);
