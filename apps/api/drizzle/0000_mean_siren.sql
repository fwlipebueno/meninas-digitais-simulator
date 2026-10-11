CREATE TABLE "activity" (
	"id" text PRIMARY KEY NOT NULL,
	"module" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_completion" (
	"session_id" uuid NOT NULL,
	"activity_id" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_completion_session_id_activity_id_pk" PRIMARY KEY("session_id","activity_id")
);
--> statement-breakpoint
CREATE TABLE "training_session" (
	"id" uuid PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_completion" ADD CONSTRAINT "activity_completion_session_id_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_completion" ADD CONSTRAINT "activity_completion_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;