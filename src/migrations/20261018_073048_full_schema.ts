import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('bn', 'en');
  CREATE TYPE "public"."enum_users_role" AS ENUM('super-admin', 'doctor', 'assistant');
  CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'LOGIN_FAILED');
  CREATE TYPE "public"."enum_chambers_booking_mode" AS ENUM('SLOT', 'SERIAL');
  CREATE TYPE "public"."enum_schedules_weekday" AS ENUM('0', '1', '2', '3', '4', '5', '6');
  CREATE TYPE "public"."enum_appointments_booking_mode" AS ENUM('SLOT', 'SERIAL');
  CREATE TYPE "public"."enum_appointments_status" AS ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
  CREATE TYPE "public"."enum_appointments_source" AS ENUM('WEB', 'ADMIN', 'PHONE');
  CREATE TYPE "public"."enum_testimonials_status" AS ENUM('PENDING', 'APPROVED', 'HIDDEN');
  CREATE TYPE "public"."enum_faqs_category" AS ENUM('general', 'booking', 'fees');
  CREATE TYPE "public"."enum_site_settings_emergency_notice_banner_type" AS ENUM('info', 'warning', 'critical');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar DEFAULT 'Admin User',
  	"role" "enum_users_role" DEFAULT 'super-admin' NOT NULL,
  	"phone" varchar DEFAULT '+8801700000000',
  	"is_active" boolean DEFAULT true,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" "enum_audit_logs_action" NOT NULL,
  	"collection_name" varchar NOT NULL,
  	"document_id" varchar NOT NULL,
  	"user_id" integer,
  	"user_role" varchar,
  	"ip_address" varchar,
  	"user_agent" varchar,
  	"diff" jsonb,
  	"timestamp" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "chambers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"city" varchar DEFAULT 'Dhaka' NOT NULL,
  	"phone" varchar NOT NULL,
  	"booking_mode" "enum_chambers_booking_mode" DEFAULT 'SLOT' NOT NULL,
  	"start_time" varchar DEFAULT '17:00' NOT NULL,
  	"end_time" varchar DEFAULT '21:00' NOT NULL,
  	"slot_duration_minutes" numeric DEFAULT 15 NOT NULL,
  	"max_patients" numeric DEFAULT 16 NOT NULL,
  	"map_url" varchar,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "chambers_locales" (
  	"name" varchar NOT NULL,
  	"address" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "schedules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"chamber_id" integer NOT NULL,
  	"weekday" "enum_schedules_weekday" NOT NULL,
  	"start_time" varchar DEFAULT '17:00' NOT NULL,
  	"end_time" varchar DEFAULT '21:00' NOT NULL,
  	"max_patients" numeric DEFAULT 16 NOT NULL,
  	"slot_duration_minutes" numeric DEFAULT 15 NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "leaves" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"chamber_id" integer,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone NOT NULL,
  	"is_all_day" boolean DEFAULT true,
  	"reason" varchar DEFAULT 'Medical Conference / Leave' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "appointments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference_code" varchar NOT NULL,
  	"chamber_id" integer NOT NULL,
  	"date" varchar NOT NULL,
  	"slot_start" varchar,
  	"slot_end" varchar,
  	"serial_number" numeric,
  	"booking_mode" "enum_appointments_booking_mode" DEFAULT 'SLOT' NOT NULL,
  	"patient_name" varchar NOT NULL,
  	"patient_phone" varchar NOT NULL,
  	"patient_email" varchar,
  	"status" "enum_appointments_status" DEFAULT 'PENDING' NOT NULL,
  	"source" "enum_appointments_source" DEFAULT 'WEB',
  	"notes" varchar,
  	"expires_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"content" jsonb,
  	"order" numeric DEFAULT 0,
  	"is_published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "services_locales" (
  	"title" varchar NOT NULL,
  	"summary" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "blog_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"content" jsonb,
  	"reading_time" varchar DEFAULT '5 min read',
  	"published_at" timestamp(3) with time zone,
  	"is_published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blog_posts_locales" (
  	"title" varchar NOT NULL,
  	"excerpt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"patient_name" varchar NOT NULL,
  	"rating" numeric DEFAULT 5,
  	"status" "enum_testimonials_status" DEFAULT 'PENDING',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "testimonials_locales" (
  	"feedback" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"category" "enum_faqs_category" DEFAULT 'general',
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faqs_locales" (
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"audit_logs_id" integer,
  	"chambers_id" integer,
  	"schedules_id" integer,
  	"leaves_id" integer,
  	"appointments_id" integer,
  	"services_id" integer,
  	"blog_posts_id" integer,
  	"testimonials_id" integer,
  	"faqs_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "doctor_profile_degrees" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"degree" varchar NOT NULL,
  	"institution" varchar NOT NULL,
  	"year" varchar
  );
  
  CREATE TABLE "doctor_profile_experience_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_year" varchar NOT NULL,
  	"end_year" varchar,
  	"is_current" boolean DEFAULT false
  );
  
  CREATE TABLE "doctor_profile_experience_timeline_locales" (
  	"role" varchar NOT NULL,
  	"organization" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "doctor_profile_awards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"organization" varchar,
  	"year" varchar
  );
  
  CREATE TABLE "doctor_profile_awards_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "doctor_profile_memberships" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar
  );
  
  CREATE TABLE "doctor_profile" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bmdc_registration_number" varchar NOT NULL,
  	"profile_image_id" integer NOT NULL,
  	"signature_image_id" integer,
  	"contact_details_office_phone" varchar,
  	"contact_details_official_email" varchar,
  	"contact_details_assistant_phone" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "doctor_profile_locales" (
  	"name" varchar NOT NULL,
  	"designation" varchar NOT NULL,
  	"speciality" varchar NOT NULL,
  	"biography" jsonb NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"emergency_hotline" varchar NOT NULL,
  	"emergency_notice_banner_enabled" boolean DEFAULT false,
  	"emergency_notice_banner_type" "enum_site_settings_emergency_notice_banner_type" DEFAULT 'info',
  	"maintenance_mode" boolean DEFAULT false,
  	"booking_enabled" boolean DEFAULT true,
  	"contact_email" varchar NOT NULL,
  	"whatsapp_number" varchar NOT NULL,
  	"social_links_facebook" varchar,
  	"social_links_linkedin" varchar,
  	"social_links_youtube" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"site_name" varchar NOT NULL,
  	"tagline" varchar NOT NULL,
  	"clinic_name" varchar NOT NULL,
  	"emergency_disclaimer" varchar DEFAULT 'জরুরি চিকিৎসা সেবার ক্ষেত্রে (যেমন: তীব্র বুকে ব্যথা, শ্বাসকষ্ট বা সংজ্ঞাহীনতা) অনুগ্রহ করে অনতিবিলম্বে নিকটস্থ হাসপাতালের জরুরি বিভাগে যোগাযোগ করুন। এই অনলাইন পোর্টাল শুধুমাত্র পূর্বনির্ধারিত সাধারণ ও বিশেষজ্ঞ পরামর্শের জন্য প্রযোজ্য।' NOT NULL,
  	"emergency_notice_banner_message" varchar,
  	"booking_notice" varchar DEFAULT 'অনুগ্রহ করে নির্ধারিত সময়ের অন্তত ১৫ মিনিট পূর্বে চেম্বারে উপস্থিত থাকুন এবং আপনার পূর্ববর্তী সমস্ত প্রেসক্রিপশন ও রিপোর্ট সঙ্গে রাখুন।',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "chambers_locales" ADD CONSTRAINT "chambers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."chambers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "schedules" ADD CONSTRAINT "schedules_chamber_id_chambers_id_fk" FOREIGN KEY ("chamber_id") REFERENCES "public"."chambers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leaves" ADD CONSTRAINT "leaves_chamber_id_chambers_id_fk" FOREIGN KEY ("chamber_id") REFERENCES "public"."chambers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "appointments" ADD CONSTRAINT "appointments_chamber_id_chambers_id_fk" FOREIGN KEY ("chamber_id") REFERENCES "public"."chambers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_locales" ADD CONSTRAINT "services_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_posts_locales" ADD CONSTRAINT "blog_posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "testimonials_locales" ADD CONSTRAINT "testimonials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faqs_locales" ADD CONSTRAINT "faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_chambers_fk" FOREIGN KEY ("chambers_id") REFERENCES "public"."chambers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_schedules_fk" FOREIGN KEY ("schedules_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leaves_fk" FOREIGN KEY ("leaves_id") REFERENCES "public"."leaves"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_appointments_fk" FOREIGN KEY ("appointments_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_posts_fk" FOREIGN KEY ("blog_posts_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "doctor_profile_degrees" ADD CONSTRAINT "doctor_profile_degrees_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."doctor_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "doctor_profile_experience_timeline" ADD CONSTRAINT "doctor_profile_experience_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."doctor_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "doctor_profile_experience_timeline_locales" ADD CONSTRAINT "doctor_profile_experience_timeline_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."doctor_profile_experience_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "doctor_profile_awards" ADD CONSTRAINT "doctor_profile_awards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."doctor_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "doctor_profile_awards_locales" ADD CONSTRAINT "doctor_profile_awards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."doctor_profile_awards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "doctor_profile_memberships" ADD CONSTRAINT "doctor_profile_memberships_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."doctor_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "doctor_profile" ADD CONSTRAINT "doctor_profile_profile_image_id_media_id_fk" FOREIGN KEY ("profile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "doctor_profile" ADD CONSTRAINT "doctor_profile_signature_image_id_media_id_fk" FOREIGN KEY ("signature_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "doctor_profile_locales" ADD CONSTRAINT "doctor_profile_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."doctor_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_locales_parent_id_idx" ON "media_locales" USING btree ("_parent_id");
  CREATE INDEX "audit_logs_collection_name_idx" ON "audit_logs" USING btree ("collection_name");
  CREATE INDEX "audit_logs_document_id_idx" ON "audit_logs" USING btree ("document_id");
  CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");
  CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs" USING btree ("timestamp");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE INDEX "chambers_updated_at_idx" ON "chambers" USING btree ("updated_at");
  CREATE INDEX "chambers_created_at_idx" ON "chambers" USING btree ("created_at");
  CREATE UNIQUE INDEX "chambers_locales_locale_parent_id_unique" ON "chambers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "chambers_locales_parent_id_idx" ON "chambers_locales" USING btree ("_parent_id");
  CREATE INDEX "schedules_chamber_idx" ON "schedules" USING btree ("chamber_id");
  CREATE INDEX "schedules_updated_at_idx" ON "schedules" USING btree ("updated_at");
  CREATE INDEX "schedules_created_at_idx" ON "schedules" USING btree ("created_at");
  CREATE INDEX "leaves_chamber_idx" ON "leaves" USING btree ("chamber_id");
  CREATE INDEX "leaves_updated_at_idx" ON "leaves" USING btree ("updated_at");
  CREATE INDEX "leaves_created_at_idx" ON "leaves" USING btree ("created_at");
  CREATE UNIQUE INDEX "appointments_reference_code_idx" ON "appointments" USING btree ("reference_code");
  CREATE INDEX "appointments_chamber_idx" ON "appointments" USING btree ("chamber_id");
  CREATE INDEX "appointments_date_idx" ON "appointments" USING btree ("date");
  CREATE INDEX "appointments_patient_phone_idx" ON "appointments" USING btree ("patient_phone");
  CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");
  CREATE INDEX "appointments_updated_at_idx" ON "appointments" USING btree ("updated_at");
  CREATE INDEX "appointments_created_at_idx" ON "appointments" USING btree ("created_at");
  CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE UNIQUE INDEX "services_locales_locale_parent_id_unique" ON "services_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_locales_parent_id_idx" ON "services_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");
  CREATE INDEX "blog_posts_updated_at_idx" ON "blog_posts" USING btree ("updated_at");
  CREATE INDEX "blog_posts_created_at_idx" ON "blog_posts" USING btree ("created_at");
  CREATE UNIQUE INDEX "blog_posts_locales_locale_parent_id_unique" ON "blog_posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "blog_posts_locales_parent_id_idx" ON "blog_posts_locales" USING btree ("_parent_id");
  CREATE INDEX "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE UNIQUE INDEX "testimonials_locales_locale_parent_id_unique" ON "testimonials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "testimonials_locales_parent_id_idx" ON "testimonials_locales" USING btree ("_parent_id");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE UNIQUE INDEX "faqs_locales_locale_parent_id_unique" ON "faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "faqs_locales_parent_id_idx" ON "faqs_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");
  CREATE INDEX "payload_locked_documents_rels_chambers_id_idx" ON "payload_locked_documents_rels" USING btree ("chambers_id");
  CREATE INDEX "payload_locked_documents_rels_schedules_id_idx" ON "payload_locked_documents_rels" USING btree ("schedules_id");
  CREATE INDEX "payload_locked_documents_rels_leaves_id_idx" ON "payload_locked_documents_rels" USING btree ("leaves_id");
  CREATE INDEX "payload_locked_documents_rels_appointments_id_idx" ON "payload_locked_documents_rels" USING btree ("appointments_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_blog_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_posts_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "doctor_profile_degrees_order_idx" ON "doctor_profile_degrees" USING btree ("_order");
  CREATE INDEX "doctor_profile_degrees_parent_id_idx" ON "doctor_profile_degrees" USING btree ("_parent_id");
  CREATE INDEX "doctor_profile_experience_timeline_order_idx" ON "doctor_profile_experience_timeline" USING btree ("_order");
  CREATE INDEX "doctor_profile_experience_timeline_parent_id_idx" ON "doctor_profile_experience_timeline" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "doctor_profile_experience_timeline_locales_locale_parent_id_" ON "doctor_profile_experience_timeline_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "doctor_profile_experience_timeline_locales_parent_id_idx" ON "doctor_profile_experience_timeline_locales" USING btree ("_parent_id");
  CREATE INDEX "doctor_profile_awards_order_idx" ON "doctor_profile_awards" USING btree ("_order");
  CREATE INDEX "doctor_profile_awards_parent_id_idx" ON "doctor_profile_awards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "doctor_profile_awards_locales_locale_parent_id_unique" ON "doctor_profile_awards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "doctor_profile_awards_locales_parent_id_idx" ON "doctor_profile_awards_locales" USING btree ("_parent_id");
  CREATE INDEX "doctor_profile_memberships_order_idx" ON "doctor_profile_memberships" USING btree ("_order");
  CREATE INDEX "doctor_profile_memberships_parent_id_idx" ON "doctor_profile_memberships" USING btree ("_parent_id");
  CREATE INDEX "doctor_profile_profile_image_idx" ON "doctor_profile" USING btree ("profile_image_id");
  CREATE INDEX "doctor_profile_signature_image_idx" ON "doctor_profile" USING btree ("signature_image_id");
  CREATE UNIQUE INDEX "doctor_profile_locales_locale_parent_id_unique" ON "doctor_profile_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "doctor_profile_locales_parent_id_idx" ON "doctor_profile_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_locales_parent_id_idx" ON "site_settings_locales" USING btree ("_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "chambers" CASCADE;
  DROP TABLE "chambers_locales" CASCADE;
  DROP TABLE "schedules" CASCADE;
  DROP TABLE "leaves" CASCADE;
  DROP TABLE "appointments" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "services_locales" CASCADE;
  DROP TABLE "blog_posts" CASCADE;
  DROP TABLE "blog_posts_locales" CASCADE;
  DROP TABLE "testimonials" CASCADE;
  DROP TABLE "testimonials_locales" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "faqs_locales" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "doctor_profile_degrees" CASCADE;
  DROP TABLE "doctor_profile_experience_timeline" CASCADE;
  DROP TABLE "doctor_profile_experience_timeline_locales" CASCADE;
  DROP TABLE "doctor_profile_awards" CASCADE;
  DROP TABLE "doctor_profile_awards_locales" CASCADE;
  DROP TABLE "doctor_profile_memberships" CASCADE;
  DROP TABLE "doctor_profile" CASCADE;
  DROP TABLE "doctor_profile_locales" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_audit_logs_action";
  DROP TYPE "public"."enum_chambers_booking_mode";
  DROP TYPE "public"."enum_schedules_weekday";
  DROP TYPE "public"."enum_appointments_booking_mode";
  DROP TYPE "public"."enum_appointments_status";
  DROP TYPE "public"."enum_appointments_source";
  DROP TYPE "public"."enum_testimonials_status";
  DROP TYPE "public"."enum_faqs_category";
  DROP TYPE "public"."enum_site_settings_emergency_notice_banner_type";`)
}
