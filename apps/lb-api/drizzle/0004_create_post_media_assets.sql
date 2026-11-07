CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"object_key" varchar(512) NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"uploaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_object_key_unique" UNIQUE("object_key")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"image_asset_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" varchar(1000),
	"original_price" integer,
	"current_price" integer NOT NULL,
	"initial_quantity" integer NOT NULL,
	"remaining_quantity" integer NOT NULL,
	"pickup_start_at" timestamp with time zone NOT NULL,
	"pickup_end_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"store_name_snapshot" varchar(100) NOT NULL,
	"phone_snapshot" varchar(10) NOT NULL,
	"address_snapshot" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_current_price_non_negative" CHECK ("posts"."current_price" >= 0),
	CONSTRAINT "posts_initial_quantity_positive" CHECK ("posts"."initial_quantity" > 0),
	CONSTRAINT "posts_remaining_quantity_valid" CHECK ("posts"."remaining_quantity" >= 0 and "posts"."remaining_quantity" <= "posts"."initial_quantity"),
	CONSTRAINT "posts_pickup_window_valid" CHECK ("posts"."pickup_start_at" < "posts"."pickup_end_at"),
	CONSTRAINT "posts_expiry_within_pickup_window" CHECK ("posts"."expires_at" <= "posts"."pickup_end_at"),
	CONSTRAINT "posts_original_price_valid" CHECK ("posts"."original_price" is null or "posts"."original_price" >= "posts"."current_price")
);
--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_assets_owner_user_id_idx" ON "media_assets" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "posts_store_id_idx" ON "posts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "posts_expires_at_idx" ON "posts" USING btree ("expires_at");