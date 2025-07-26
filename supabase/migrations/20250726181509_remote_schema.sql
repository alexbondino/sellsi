COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."ban_user"("target_user_id" "uuid", "admin_reason" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$BEGIN
    UPDATE public.users 
    SET 
        banned = true,
        banned_at = now(),
        banned_reason = admin_reason,
        updatedt = now()
    WHERE user_id = target_user_id;
    
    -- Verificar que la actualización fue exitosa
    IF FOUND THEN
        -- Log de la acción (opcional - requiere tabla de logs)
        -- INSERT INTO admin_logs (action, target_user_id, admin_reason, created_at)
        -- VALUES ('USER_BANNED', target_user_id, admin_reason, now());
        
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;$$;


ALTER FUNCTION "public"."ban_user"("target_user_id" "uuid", "admin_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clean_expired_admin_sessions"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  UPDATE admin_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
END;$$;


ALTER FUNCTION "public"."clean_expired_admin_sessions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_banned_users"() RETURNS TABLE("user_id" "uuid", "user_name" "text", "email" "text", "banned_at" timestamp with time zone, "banned_reason" "text", "days_banned" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Se retorna el resultado de esta consulta SELECT
  RETURN QUERY
  SELECT 
    u.id, 
    u.raw_user_meta_data->>'full_name', -- Ajusta los nombres de las columnas a tu tabla real
    u.email,
    u.banned_until,
    u.raw_user_meta_data->>'banned_reason',
    (u.banned_until::date - now()::date)
  FROM 
    auth.users u -- O la tabla donde guardas tus usuarios
  WHERE
    u.banned_until IS NOT NULL AND u.banned_until > now();
END;
$$;


ALTER FUNCTION "public"."get_banned_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_ban_info"("target_user_id" "uuid") RETURNS TABLE("user_id" "uuid", "user_name" "text", "email" "text", "is_banned" boolean, "banned_at" timestamp with time zone, "banned_reason" "text", "days_banned" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.raw_user_meta_data->>'full_name',
    u.email,
    (u.banned_until IS NOT NULL AND u.banned_until > now()) AS is_banned,
    u.banned_until AS banned_at,
    u.raw_user_meta_data->>'banned_reason',
    CASE
      WHEN u.banned_until > now() THEN (u.banned_until::date - now()::date)
      ELSE 0
    END::integer AS days_banned
  FROM
    auth.users u
  WHERE
    u.id = target_user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_ban_info"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  meta JSONB;
BEGIN
  meta := NEW.raw_user_meta_data;

  INSERT INTO public.users (
    user_id,
    email,
    user_nm,            -- Nombre original 'user_nm'
    main_supplier,      -- Nombre original 'main_supplier'
    phone_nbr,          -- Nombre original 'phone_nbr'
    country,
    createdt,           -- Nombre original 'createdt'
    updatedt            -- Nombre original 'updatedt'
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(meta->>'full_name', 'Pendiente'),
    COALESCE((meta->>'proveedor')::BOOLEAN, FALSE),
    meta->>'phone',
    COALESCE(meta->>'pais', 'CL'), -- Asumiendo 'CL' como default si no se provee
    NOW(),
    NOW()
  );

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  meta JSONB;
BEGIN
  meta := NEW.raw_user_meta_data;

  UPDATE public.users
  SET
    email = NEW.email,
    user_nm = COALESCE(meta->>'full_name', user_nm), -- Nombre original 'user_nm'
    main_supplier = COALESCE((meta->>'proveedor')::BOOLEAN, main_supplier), -- Nombre original 'main_supplier'
    phone_nbr = COALESCE(meta->>'phone', phone_nbr), -- Nombre original 'phone_nbr'
    country = COALESCE(meta->>'pais', country),
    updatedt = NOW() -- Nombre original 'updatedt'
  WHERE user_id = NEW.id;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."handle_user_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unban_user"("target_user_id" "uuid", "admin_reason" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$BEGIN
    UPDATE public.users 
    SET 
        banned = false,
        banned_at = NULL,
        banned_reason = NULL,
        updatedt = now()
    WHERE user_id = target_user_id;
    
    -- Verificar que la actualización fue exitosa
    IF FOUND THEN
        -- Log de la acción (opcional - requiere tabla de logs)
        -- INSERT INTO admin_logs (action, target_user_id, admin_reason, created_at)
        -- VALUES ('USER_UNBANNED', target_user_id, admin_reason, now());
        
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;$$;


ALTER FUNCTION "public"."unban_user"("target_user_id" "uuid", "admin_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "target_id" "uuid",
    "details" "jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "ip_address" "text",
    "user_agent" "text"
);


ALTER TABLE "public"."admin_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_sessions" (
    "session_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "ip_address" "text",
    "user_agent" "text",
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."admin_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_info" (
    "user_id" "uuid",
    "account_holder" character varying,
    "bank" character varying,
    "account_number" character varying,
    "transfer_rut" character varying,
    "confirmation_email" "text",
    "account_type" character varying DEFAULT 'corriente'::character varying
);


ALTER TABLE "public"."bank_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."banned_ips" (
    "ip" "text" NOT NULL,
    "banned_at" timestamp with time zone DEFAULT "now"(),
    "banned_reason" "text",
    "banned_by" "uuid"
);


ALTER TABLE "public"."banned_ips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_info" (
    "user_id" "uuid",
    "business_name" character varying,
    "billing_rut" character varying,
    "business_line" character varying,
    "billing_address" "text",
    "billing_region" "text",
    "billing_commune" "text"
);


ALTER TABLE "public"."billing_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cart_items" (
    "cart_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "price_at_addition" numeric,
    "price_tiers" "jsonb",
    "cart_items_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cart_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."cart_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carts" (
    "user_id" "uuid" NOT NULL,
    "cart_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."carts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."control_panel_users" (
    "usuario" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "last_login" timestamp with time zone,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "full_name" "text",
    "role" "text" DEFAULT 'admin'::"text",
    "twofa_secret" "text",
    "notes" "text",
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "twofa_required" boolean DEFAULT true,
    "twofa_configured" boolean DEFAULT false,
    CONSTRAINT "control_panel_users_role_check" CHECK (("role" = 'admin'::"text"))
);


ALTER TABLE "public"."control_panel_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ejemplo" (
    "id" bigint NOT NULL,
    "nombre" "text"
);


ALTER TABLE "public"."ejemplo" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ejemplo_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ejemplo_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ejemplo_id_seq" OWNED BY "public"."ejemplo"."id";



CREATE TABLE IF NOT EXISTS "public"."khipu_webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" character varying,
    "transaction_id" character varying,
    "status" character varying,
    "webhook_data" "jsonb",
    "signature_header" "text",
    "processed" boolean DEFAULT false,
    "processed_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."khipu_webhook_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "items" "jsonb" NOT NULL,
    "subtotal" numeric DEFAULT 0 NOT NULL,
    "tax" numeric DEFAULT 0 NOT NULL,
    "shipping" numeric DEFAULT 0 NOT NULL,
    "total" numeric DEFAULT 0 NOT NULL,
    "currency" character varying DEFAULT 'CLP'::character varying NOT NULL,
    "status" character varying DEFAULT 'pending'::character varying NOT NULL,
    "payment_method" character varying,
    "payment_status" character varying DEFAULT 'pending'::character varying NOT NULL,
    "shipping_address" "jsonb",
    "billing_address" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "khipu_payment_id" character varying,
    "khipu_transaction_id" character varying,
    "khipu_payment_url" "text",
    "khipu_expires_at" timestamp with time zone,
    "paid_at" timestamp with time zone
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "payment_method" character varying NOT NULL,
    "external_payment_id" character varying,
    "external_transaction_id" character varying,
    "amount" numeric NOT NULL,
    "currency" character varying DEFAULT 'CLP'::character varying NOT NULL,
    "status" character varying DEFAULT 'pending'::character varying NOT NULL,
    "gateway_response" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_delivery_regions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "region" "text" NOT NULL,
    "price" numeric NOT NULL,
    "delivery_days" integer NOT NULL
);


ALTER TABLE "public"."product_delivery_regions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_images" (
    "product_id" "uuid" NOT NULL,
    "image_url" "text",
    "thumbnail_url" "text",
    "thumbnails" "jsonb"
);


ALTER TABLE "public"."product_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_quantity_ranges" (
    "product_qty_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "price" numeric DEFAULT 0.00 NOT NULL,
    "product_id" "uuid",
    "min_quantity" integer NOT NULL,
    "max_quantity" integer
);


ALTER TABLE "public"."product_quantity_ranges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "productnm" "text" NOT NULL,
    "supplier_id" "uuid",
    "category" character varying,
    "description" "text",
    "max_quantity" integer,
    "productid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "productqty" integer DEFAULT 0 NOT NULL,
    "price" numeric DEFAULT 0.00 NOT NULL,
    "minimum_purchase" integer DEFAULT 1,
    "negotiable" boolean DEFAULT false,
    "product_type" character varying DEFAULT 'general'::character varying,
    "min_quantity" integer DEFAULT 1,
    "spec_name" character varying DEFAULT 'N/A'::character varying NOT NULL,
    "spec_value" "text" DEFAULT 'N/A'::"text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "createddt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updateddt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."request_products" (
    "request_id" "uuid",
    "product_id" "uuid",
    "quantity" integer NOT NULL,
    "request_product_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."request_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."requests" (
    "delivery_country" "text" NOT NULL,
    "delivery_region" "text" NOT NULL,
    "delivery_commune" "text" NOT NULL,
    "delivery_direction" "text" NOT NULL,
    "delivery_direction_number" "text" NOT NULL,
    "delivery_direction_dept" "text" NOT NULL,
    "request_dt" "date" NOT NULL,
    "delivery_dt" "date",
    "total_sale" numeric,
    "label" "text" NOT NULL,
    "buyer_id" "uuid",
    "request_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_dt" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales" (
    "user_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "trx_date" timestamp with time zone DEFAULT "now"(),
    "trx_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."sales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipping_info" (
    "user_id" "uuid",
    "shipping_region" "text",
    "shipping_commune" "text",
    "shipping_address" "text",
    "shipping_number" "text",
    "shipping_dept" "text"
);


ALTER TABLE "public"."shipping_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "rut" character varying,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "user_nm" character varying NOT NULL,
    "phone_nbr" character varying,
    "country" "text" NOT NULL,
    "logo_url" "text",
    "main_supplier" boolean DEFAULT false NOT NULL,
    "createdt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updatedt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "descripcion_proveedor" "text",
    "banned" boolean DEFAULT false NOT NULL,
    "banned_at" timestamp with time zone,
    "banned_reason" "text",
    "verified" boolean DEFAULT false NOT NULL,
    "verified_at" timestamp with time zone,
    "verified_by" "uuid",
    "last_ip" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ejemplo" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ejemplo_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_sessions"
    ADD CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("session_id");



ALTER TABLE ONLY "public"."bank_info"
    ADD CONSTRAINT "bank_info_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."banned_ips"
    ADD CONSTRAINT "banned_ips_pkey" PRIMARY KEY ("ip");



ALTER TABLE ONLY "public"."billing_info"
    ADD CONSTRAINT "billing_info_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("cart_items_id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_pkey" PRIMARY KEY ("cart_id");



ALTER TABLE ONLY "public"."control_panel_users"
    ADD CONSTRAINT "control_panel_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."control_panel_users"
    ADD CONSTRAINT "control_panel_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."control_panel_users"
    ADD CONSTRAINT "control_panel_users_usuario_key" UNIQUE ("usuario");



ALTER TABLE ONLY "public"."ejemplo"
    ADD CONSTRAINT "ejemplo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."khipu_webhook_logs"
    ADD CONSTRAINT "khipu_webhook_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_delivery_regions"
    ADD CONSTRAINT "product_delivery_regions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_delivery_regions"
    ADD CONSTRAINT "product_delivery_regions_product_id_region_key" UNIQUE ("product_id", "region");



ALTER TABLE ONLY "public"."product_quantity_ranges"
    ADD CONSTRAINT "product_quantity_ranges_pkey" PRIMARY KEY ("product_qty_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("productid");



ALTER TABLE ONLY "public"."request_products"
    ADD CONSTRAINT "request_products_pkey" PRIMARY KEY ("request_product_id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_pkey" PRIMARY KEY ("request_id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("trx_id");



ALTER TABLE ONLY "public"."shipping_info"
    ADD CONSTRAINT "shipping_info_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");



CREATE OR REPLACE TRIGGER "update_control_panel_users_updated_at" BEFORE UPDATE ON "public"."control_panel_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."control_panel_users"("id");



ALTER TABLE ONLY "public"."admin_sessions"
    ADD CONSTRAINT "admin_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."control_panel_users"("id");



ALTER TABLE ONLY "public"."bank_info"
    ADD CONSTRAINT "bank_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."banned_ips"
    ADD CONSTRAINT "banned_ips_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "public"."control_panel_users"("id");



ALTER TABLE ONLY "public"."billing_info"
    ADD CONSTRAINT "billing_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("cart_id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("productid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."product_delivery_regions"
    ADD CONSTRAINT "product_delivery_regions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("productid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("productid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_quantity_ranges"
    ADD CONSTRAINT "product_quantity_ranges_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("productid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."request_products"
    ADD CONSTRAINT "request_products_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("request_id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."shipping_info"
    ADD CONSTRAINT "shipping_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."ban_user"("target_user_id" "uuid", "admin_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."ban_user"("target_user_id" "uuid", "admin_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ban_user"("target_user_id" "uuid", "admin_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."clean_expired_admin_sessions"() TO "anon";
GRANT ALL ON FUNCTION "public"."clean_expired_admin_sessions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_expired_admin_sessions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_banned_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_banned_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_banned_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_ban_info"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_ban_info"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_ban_info"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."unban_user"("target_user_id" "uuid", "admin_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."unban_user"("target_user_id" "uuid", "admin_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unban_user"("target_user_id" "uuid", "admin_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."admin_sessions" TO "anon";
GRANT ALL ON TABLE "public"."admin_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."bank_info" TO "anon";
GRANT ALL ON TABLE "public"."bank_info" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_info" TO "service_role";



GRANT ALL ON TABLE "public"."banned_ips" TO "anon";
GRANT ALL ON TABLE "public"."banned_ips" TO "authenticated";
GRANT ALL ON TABLE "public"."banned_ips" TO "service_role";



GRANT ALL ON TABLE "public"."billing_info" TO "anon";
GRANT ALL ON TABLE "public"."billing_info" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_info" TO "service_role";



GRANT ALL ON TABLE "public"."cart_items" TO "anon";
GRANT ALL ON TABLE "public"."cart_items" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_items" TO "service_role";



GRANT ALL ON TABLE "public"."carts" TO "anon";
GRANT ALL ON TABLE "public"."carts" TO "authenticated";
GRANT ALL ON TABLE "public"."carts" TO "service_role";



GRANT ALL ON TABLE "public"."control_panel_users" TO "anon";
GRANT ALL ON TABLE "public"."control_panel_users" TO "authenticated";
GRANT ALL ON TABLE "public"."control_panel_users" TO "service_role";



GRANT ALL ON TABLE "public"."ejemplo" TO "anon";
GRANT ALL ON TABLE "public"."ejemplo" TO "authenticated";
GRANT ALL ON TABLE "public"."ejemplo" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ejemplo_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ejemplo_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ejemplo_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."khipu_webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."khipu_webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."khipu_webhook_logs" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."product_delivery_regions" TO "anon";
GRANT ALL ON TABLE "public"."product_delivery_regions" TO "authenticated";
GRANT ALL ON TABLE "public"."product_delivery_regions" TO "service_role";



GRANT ALL ON TABLE "public"."product_images" TO "anon";
GRANT ALL ON TABLE "public"."product_images" TO "authenticated";
GRANT ALL ON TABLE "public"."product_images" TO "service_role";



GRANT ALL ON TABLE "public"."product_quantity_ranges" TO "anon";
GRANT ALL ON TABLE "public"."product_quantity_ranges" TO "authenticated";
GRANT ALL ON TABLE "public"."product_quantity_ranges" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."request_products" TO "anon";
GRANT ALL ON TABLE "public"."request_products" TO "authenticated";
GRANT ALL ON TABLE "public"."request_products" TO "service_role";



GRANT ALL ON TABLE "public"."requests" TO "anon";
GRANT ALL ON TABLE "public"."requests" TO "authenticated";
GRANT ALL ON TABLE "public"."requests" TO "service_role";



GRANT ALL ON TABLE "public"."sales" TO "anon";
GRANT ALL ON TABLE "public"."sales" TO "authenticated";
GRANT ALL ON TABLE "public"."sales" TO "service_role";



GRANT ALL ON TABLE "public"."shipping_info" TO "anon";
GRANT ALL ON TABLE "public"."shipping_info" TO "authenticated";
GRANT ALL ON TABLE "public"."shipping_info" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
