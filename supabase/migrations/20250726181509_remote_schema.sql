-- SCRIPT FINAL CORREGIDO Y REORDENADO V5

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- PASO 1: Eliminar TODAS las dependencias primero (Triggers)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS update_control_panel_users_updated_at ON public.control_panel_users;

-- PASO 2: Ahora eliminar las funciones
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_update();
DROP FUNCTION IF EXISTS public.ban_user(uuid, text);
DROP FUNCTION IF EXISTS public.unban_user(uuid, text);
DROP FUNCTION IF EXISTS public.get_banned_users();
DROP FUNCTION IF EXISTS public.get_user_ban_info(uuid);
DROP FUNCTION IF EXISTS public.clean_expired_admin_sessions();

-- PASO 3: Crear las funciones desde cero
CREATE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

CREATE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE meta JSONB; BEGIN meta := NEW.raw_user_meta_data; INSERT INTO public.users ( user_id, email, user_nm, main_supplier, phone_nbr, country, createdt, updatedt ) VALUES ( NEW.id, NEW.email, COALESCE(meta->>'full_name','Pendiente'), COALESCE((meta->>'proveedor')::BOOLEAN,FALSE), meta->>'phone', COALESCE(meta->>'pais','CL'), NOW(), NOW() ); RETURN NEW; END; $$;
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

CREATE FUNCTION public.handle_user_update() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE meta JSONB; BEGIN meta := NEW.raw_user_meta_data; UPDATE public.users SET email = NEW.email, user_nm = COALESCE(meta->>'full_name', user_nm), main_supplier = COALESCE((meta->>'proveedor')::BOOLEAN, main_supplier), phone_nbr = COALESCE(meta->>'phone', phone_nbr), country = COALESCE(meta->>'pais', country), updatedt = NOW() WHERE user_id = NEW.id; RETURN NEW; END; $$;
ALTER FUNCTION public.handle_user_update() OWNER TO postgres;

CREATE FUNCTION public.ban_user(target_user_id uuid, admin_reason text) RETURNS boolean LANGUAGE plpgsql AS $$ BEGIN UPDATE public.users SET banned = true, banned_at = now(), banned_reason = admin_reason, updatedt = now() WHERE user_id = target_user_id; RETURN FOUND; END; $$;
ALTER FUNCTION public.ban_user(uuid, text) OWNER TO postgres;

CREATE FUNCTION public.unban_user(target_user_id uuid, admin_reason text) RETURNS boolean LANGUAGE plpgsql AS $$ BEGIN UPDATE public.users SET banned = false, banned_at = NULL, banned_reason = NULL, updatedt = now() WHERE user_id = target_user_id; RETURN FOUND; END; $$;
ALTER FUNCTION public.unban_user(uuid, text) OWNER TO postgres;

CREATE FUNCTION public.get_banned_users() RETURNS TABLE( user_id uuid, user_name text, email text, banned_at timestamptz, banned_reason text, days_banned integer ) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY SELECT u.id, u.raw_user_meta_data->>'full_name', u.email, u.banned_until, u.raw_user_meta_data->>'banned_reason', (u.banned_until::date - now()::date) FROM auth.users u WHERE u.banned_until IS NOT NULL AND u.banned_until > now(); END; $$;
ALTER FUNCTION public.get_banned_users() OWNER TO postgres;

CREATE FUNCTION public.get_user_ban_info(target_user_id uuid) RETURNS TABLE( user_id uuid, user_name text, email text, is_banned boolean, banned_at timestamptz, banned_reason text, days_banned integer ) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY SELECT u.id, u.raw_user_meta_data->>'full_name', u.email, (u.banned_until IS NOT NULL AND u.banned_until > now()) AS is_banned, u.banned_until AS banned_at, u.raw_user_meta_data->>'banned_reason', CASE WHEN u.banned_until > now() THEN (u.banned_until::date - now()::date) ELSE 0 END::integer AS days_banned FROM auth.users u WHERE u.id = target_user_id; END; $$;
ALTER FUNCTION public.get_user_ban_info(uuid) OWNER TO postgres;

CREATE FUNCTION public.clean_expired_admin_sessions() RETURNS void LANGUAGE plpgsql AS $$ BEGIN UPDATE admin_sessions SET is_active = false WHERE expires_at < now() AND is_active = true; END; $$;
ALTER FUNCTION public.clean_expired_admin_sessions() OWNER TO postgres;

-- PASO 4: Crear la estructura básica de las tablas
CREATE TABLE IF NOT EXISTS public.admin_audit_log ( id uuid DEFAULT gen_random_uuid() NOT NULL, admin_id uuid NOT NULL, action text NOT NULL, target_id uuid, details jsonb, timestamp timestamptz DEFAULT now(), ip_address text, user_agent text );
CREATE TABLE IF NOT EXISTS public.admin_sessions ( session_id uuid DEFAULT gen_random_uuid() NOT NULL, admin_id uuid NOT NULL, created_at timestamptz DEFAULT now(), expires_at timestamptz, ip_address text, user_agent text, is_active boolean DEFAULT true );
CREATE TABLE IF NOT EXISTS public.bank_info ( user_id uuid, account_holder varchar, bank varchar, account_number varchar, transfer_rut varchar, confirmation_email text, account_type varchar DEFAULT 'corriente' );
CREATE TABLE IF NOT EXISTS public.banned_ips ( ip text NOT NULL, banned_at timestamptz DEFAULT now(), banned_reason text, banned_by uuid );
CREATE TABLE IF NOT EXISTS public.billing_info ( user_id uuid, business_name varchar, billing_rut varchar, business_line varchar, billing_address text, billing_region text, billing_commune text );
CREATE TABLE IF NOT EXISTS public.cart_items ( cart_id uuid NOT NULL, product_id uuid NOT NULL, quantity integer NOT NULL, price_at_addition numeric, price_tiers jsonb, cart_items_id uuid DEFAULT gen_random_uuid() NOT NULL, added_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), CONSTRAINT cart_items_quantity_check CHECK (quantity > 0) );
CREATE TABLE IF NOT EXISTS public.carts ( user_id uuid NOT NULL, cart_id uuid DEFAULT gen_random_uuid() NOT NULL, status text DEFAULT 'active' NOT NULL, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.control_panel_users ( usuario text NOT NULL, password_hash text NOT NULL, last_login timestamptz, id uuid DEFAULT gen_random_uuid() NOT NULL, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), email text, full_name text, role text DEFAULT 'admin', twofa_secret text, notes text, created_by uuid, updated_at timestamptz DEFAULT now(), twofa_required boolean DEFAULT true, twofa_configured boolean DEFAULT false, CONSTRAINT control_panel_users_role_check CHECK(role = 'admin') );
CREATE TABLE IF NOT EXISTS public.ejemplo ( id bigint NOT NULL, nombre text );
CREATE SEQUENCE IF NOT EXISTS public.ejemplo_id_seq START WITH 1 INCREMENT BY 1 CACHE 1;
CREATE TABLE IF NOT EXISTS public.khipu_webhook_logs ( id uuid DEFAULT gen_random_uuid() NOT NULL, payment_id varchar, transaction_id varchar, status varchar, webhook_data jsonb, signature_header text, processed boolean DEFAULT false, processed_at timestamptz, error_message text, created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.orders ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, items jsonb NOT NULL, subtotal numeric DEFAULT 0 NOT NULL, tax numeric DEFAULT 0 NOT NULL, shipping numeric DEFAULT 0 NOT NULL, total numeric DEFAULT 0 NOT NULL, currency varchar DEFAULT 'CLP' NOT NULL, status varchar DEFAULT 'pending' NOT NULL, payment_method varchar, payment_status varchar DEFAULT 'pending' NOT NULL, shipping_address jsonb, billing_address jsonb, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL, khipu_payment_id varchar, khipu_transaction_id varchar, khipu_payment_url text, khipu_expires_at timestamptz, paid_at timestamptz );
CREATE TABLE IF NOT EXISTS public.payment_transactions ( id uuid DEFAULT gen_random_uuid() NOT NULL, order_id uuid NOT NULL, payment_method varchar NOT NULL, external_payment_id varchar, external_transaction_id varchar, amount numeric NOT NULL, currency varchar DEFAULT 'CLP' NOT NULL, status varchar DEFAULT 'pending' NOT NULL, gateway_response jsonb, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL, processed_at timestamptz );
CREATE TABLE IF NOT EXISTS public.product_delivery_regions ( id uuid DEFAULT gen_random_uuid() NOT NULL, product_id uuid NOT NULL, region text NOT NULL, price numeric NOT NULL, delivery_days integer NOT NULL );
CREATE TABLE IF NOT EXISTS public.product_images ( product_id uuid NOT NULL, image_url text, thumbnail_url text, thumbnails jsonb );
CREATE TABLE IF NOT EXISTS public.product_quantity_ranges ( product_qty_id uuid DEFAULT gen_random_uuid() NOT NULL, price numeric DEFAULT 0.00 NOT NULL, product_id uuid, min_quantity integer NOT NULL, max_quantity integer );
CREATE TABLE IF NOT EXISTS public.products ( productnm text NOT NULL, supplier_id uuid, category varchar, description text, max_quantity integer, productid uuid DEFAULT gen_random_uuid() NOT NULL, productqty integer DEFAULT 0 NOT NULL, price numeric DEFAULT 0.00 NOT NULL, minimum_purchase integer DEFAULT 1, negotiable boolean DEFAULT false, product_type varchar DEFAULT 'general', min_quantity integer DEFAULT 1, spec_name varchar DEFAULT 'N/A', spec_value text DEFAULT 'N/A', is_active boolean DEFAULT true, createddt timestamptz DEFAULT now() NOT NULL, updateddt timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.request_products ( request_id uuid, product_id uuid, quantity integer NOT NULL, request_product_id uuid DEFAULT gen_random_uuid() NOT NULL );
CREATE TABLE IF NOT EXISTS public.requests ( delivery_country text NOT NULL, delivery_region text NOT NULL, delivery_commune text NOT NULL, delivery_direction text NOT NULL, delivery_direction_number text NOT NULL, delivery_direction_dept text NOT NULL, request_dt date NOT NULL, delivery_dt date, total_sale numeric, label text NOT NULL, buyer_id uuid, request_id uuid DEFAULT gen_random_uuid() NOT NULL, created_dt timestamp WITHOUT time zone DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.sales ( user_id uuid NOT NULL, amount numeric NOT NULL, trx_date timestamptz DEFAULT now(), trx_id uuid DEFAULT gen_random_uuid() NOT NULL );
CREATE TABLE IF NOT EXISTS public.shipping_info ( user_id uuid, shipping_region text, shipping_commune text, shipping_address text, shipping_number text, shipping_dept text );
CREATE TABLE IF NOT EXISTS public.users ( rut varchar, user_id uuid NOT NULL, email text NOT NULL, user_nm varchar NOT NULL, phone_nbr varchar, country text NOT NULL, logo_url text, main_supplier boolean DEFAULT false NOT NULL, createdt timestamptz DEFAULT now() NOT NULL, updatedt timestamptz DEFAULT now() NOT NULL, descripcion_proveedor text, banned boolean DEFAULT false NOT NULL, banned_at timestamptz, banned_reason text, verified boolean DEFAULT false NOT NULL, verified_at timestamptz, verified_by uuid, last_ip text );

-- PASO 5: Eliminar TODAS las claves foráneas (para romper dependencias)
ALTER TABLE public.admin_audit_log DROP CONSTRAINT IF EXISTS admin_audit_log_admin_id_fkey;
ALTER TABLE public.admin_sessions DROP CONSTRAINT IF EXISTS admin_sessions_admin_id_fkey;
ALTER TABLE public.bank_info DROP CONSTRAINT IF EXISTS bank_info_user_id_fkey;
ALTER TABLE public.banned_ips DROP CONSTRAINT IF EXISTS banned_ips_banned_by_fkey;
ALTER TABLE public.billing_info DROP CONSTRAINT IF EXISTS billing_info_user_id_fkey;
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_id_fkey;
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;
ALTER TABLE public.carts DROP CONSTRAINT IF EXISTS carts_user_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_order_id_fkey;
ALTER TABLE public.product_delivery_regions DROP CONSTRAINT IF EXISTS product_delivery_regions_product_id_fkey;
ALTER TABLE public.product_images DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;
ALTER TABLE public.product_quantity_ranges DROP CONSTRAINT IF EXISTS product_quantity_ranges_product_id_fkey;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_supplier_id_fkey;
ALTER TABLE public.request_products DROP CONSTRAINT IF EXISTS request_products_request_id_fkey;
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_buyer_id_fkey;
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_user_id_fkey;
ALTER TABLE public.shipping_info DROP CONSTRAINT IF EXISTS shipping_info_user_id_fkey;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_id_fkey;

-- PASO 6: Eliminar y Recrear TODAS las claves primarias y únicas
ALTER TABLE public.admin_audit_log DROP CONSTRAINT IF EXISTS admin_audit_log_pkey CASCADE;
ALTER TABLE public.admin_audit_log ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);
ALTER TABLE public.admin_sessions DROP CONSTRAINT IF EXISTS admin_sessions_pkey CASCADE;
ALTER TABLE public.admin_sessions ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (session_id);
ALTER TABLE public.bank_info DROP CONSTRAINT IF EXISTS bank_info_user_id_key CASCADE;
ALTER TABLE public.bank_info ADD CONSTRAINT bank_info_user_id_key UNIQUE (user_id);
ALTER TABLE public.banned_ips DROP CONSTRAINT IF EXISTS banned_ips_pkey CASCADE;
ALTER TABLE public.banned_ips ADD CONSTRAINT banned_ips_pkey PRIMARY KEY (ip);
ALTER TABLE public.billing_info DROP CONSTRAINT IF EXISTS billing_info_user_id_key CASCADE;
ALTER TABLE public.billing_info ADD CONSTRAINT billing_info_user_id_key UNIQUE (user_id);
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_pkey CASCADE;
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_pkey PRIMARY KEY (cart_items_id);
ALTER TABLE public.carts DROP CONSTRAINT IF EXISTS carts_pkey CASCADE;
ALTER TABLE public.carts ADD CONSTRAINT carts_pkey PRIMARY KEY (cart_id);
ALTER TABLE public.control_panel_users DROP CONSTRAINT IF EXISTS control_panel_users_email_key CASCADE;
ALTER TABLE public.control_panel_users ADD CONSTRAINT control_panel_users_email_key UNIQUE (email);
ALTER TABLE public.control_panel_users DROP CONSTRAINT IF EXISTS control_panel_users_usuario_key CASCADE;
ALTER TABLE public.control_panel_users ADD CONSTRAINT control_panel_users_usuario_key UNIQUE (usuario);
ALTER TABLE public.control_panel_users DROP CONSTRAINT IF EXISTS control_panel_users_pkey CASCADE;
ALTER TABLE public.control_panel_users ADD CONSTRAINT control_panel_users_pkey PRIMARY KEY (id);
ALTER TABLE public.ejemplo DROP CONSTRAINT IF EXISTS ejemplo_pkey CASCADE;
ALTER TABLE public.ejemplo ADD CONSTRAINT ejemplo_pkey PRIMARY KEY (id);
ALTER TABLE public.khipu_webhook_logs DROP CONSTRAINT IF EXISTS khipu_webhook_logs_pkey CASCADE;
ALTER TABLE public.khipu_webhook_logs ADD CONSTRAINT khipu_webhook_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_pkey CASCADE;
ALTER TABLE public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_pkey CASCADE;
ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);
ALTER TABLE public.product_delivery_regions DROP CONSTRAINT IF EXISTS product_delivery_regions_pkey CASCADE;
ALTER TABLE public.product_delivery_regions ADD CONSTRAINT product_delivery_regions_pkey PRIMARY KEY (id);
ALTER TABLE public.product_delivery_regions DROP CONSTRAINT IF EXISTS product_delivery_regions_product_id_region_key CASCADE;
ALTER TABLE public.product_delivery_regions ADD CONSTRAINT product_delivery_regions_product_id_region_key UNIQUE (product_id, region);
ALTER TABLE public.product_quantity_ranges DROP CONSTRAINT IF EXISTS product_quantity_ranges_pkey CASCADE;
ALTER TABLE public.product_quantity_ranges ADD CONSTRAINT product_quantity_ranges_pkey PRIMARY KEY (product_qty_id);
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_pkey CASCADE;
ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (productid);
ALTER TABLE public.request_products DROP CONSTRAINT IF EXISTS request_products_pkey CASCADE;
ALTER TABLE public.request_products ADD CONSTRAINT request_products_pkey PRIMARY KEY (request_product_id);
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_pkey CASCADE;
ALTER TABLE public.requests ADD CONSTRAINT requests_pkey PRIMARY KEY (request_id);
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_pkey CASCADE;
ALTER TABLE public.sales ADD CONSTRAINT sales_pkey PRIMARY KEY (trx_id);
ALTER TABLE public.shipping_info DROP CONSTRAINT IF EXISTS shipping_info_user_id_key CASCADE;
ALTER TABLE public.shipping_info ADD CONSTRAINT shipping_info_user_id_key UNIQUE (user_id);
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key CASCADE;
ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey CASCADE;
ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);

-- PASO 7: Recrear TODAS las claves foráneas
ALTER TABLE ONLY public.admin_audit_log ADD CONSTRAINT admin_audit_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.control_panel_users(id);
ALTER TABLE ONLY public.admin_sessions ADD CONSTRAINT admin_sessions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.control_panel_users(id);
ALTER TABLE ONLY public.bank_info ADD CONSTRAINT bank_info_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.banned_ips ADD CONSTRAINT banned_ips_banned_by_fkey FOREIGN KEY (banned_by) REFERENCES public.control_panel_users(id);
ALTER TABLE ONLY public.billing_info ADD CONSTRAINT billing_info_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(cart_id);
ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid) ON DELETE CASCADE;
ALTER TABLE ONLY public.carts ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.payment_transactions ADD CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.product_delivery_regions ADD CONSTRAINT product_delivery_regions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_images ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_quantity_ranges ADD CONSTRAINT product_quantity_ranges_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid) ON DELETE CASCADE;
ALTER TABLE ONLY public.products ADD CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.request_products ADD CONSTRAINT request_products_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(request_id);
ALTER TABLE ONLY public.requests ADD CONSTRAINT requests_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.sales ADD CONSTRAINT sales_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.shipping_info ADD CONSTRAINT shipping_info_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- PASO 8: Recrear triggers
CREATE TRIGGER update_control_panel_users_updated_at BEFORE UPDATE ON public.control_panel_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
--CREATE TRIGGER on_auth_user_updated AFTER UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- PASO 9: Configurar secuencias y permisos
ALTER SEQUENCE IF EXISTS public.ejemplo_id_seq OWNED BY public.ejemplo.id;
ALTER TABLE ONLY public.ejemplo ALTER COLUMN id SET DEFAULT nextval('public.ejemplo_id_seq'::regclass);
ALTER PUBLICATION supabase_realtime OWNER TO postgres;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

RESET ALL;