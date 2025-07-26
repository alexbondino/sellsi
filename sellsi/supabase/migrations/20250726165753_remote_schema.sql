create table "public"."admin_audit_log" (
    "id" uuid not null default gen_random_uuid(),
    "admin_id" uuid not null,
    "action" text not null,
    "target_id" uuid,
    "details" jsonb,
    "timestamp" timestamp with time zone default now(),
    "ip_address" text,
    "user_agent" text
);


create table "public"."admin_sessions" (
    "session_id" uuid not null default gen_random_uuid(),
    "admin_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "expires_at" timestamp with time zone,
    "ip_address" text,
    "user_agent" text,
    "is_active" boolean default true
);


create table "public"."bank_info" (
    "user_id" uuid,
    "account_holder" character varying,
    "bank" character varying,
    "account_number" character varying,
    "transfer_rut" character varying,
    "confirmation_email" text,
    "account_type" character varying default 'corriente'::character varying
);


create table "public"."banned_ips" (
    "ip" text not null,
    "banned_at" timestamp with time zone default now(),
    "banned_reason" text,
    "banned_by" uuid
);


create table "public"."billing_info" (
    "user_id" uuid,
    "business_name" character varying,
    "billing_rut" character varying,
    "business_line" character varying,
    "billing_address" text,
    "billing_region" text,
    "billing_commune" text
);


create table "public"."cart_items" (
    "cart_id" uuid not null,
    "product_id" uuid not null,
    "quantity" integer not null,
    "price_at_addition" numeric,
    "price_tiers" jsonb,
    "cart_items_id" uuid not null default gen_random_uuid(),
    "added_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."carts" (
    "user_id" uuid not null,
    "cart_id" uuid not null default gen_random_uuid(),
    "status" text not null default 'active'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."control_panel_users" (
    "usuario" text not null,
    "password_hash" text not null,
    "last_login" timestamp with time zone,
    "id" uuid not null default gen_random_uuid(),
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "email" text,
    "full_name" text,
    "role" text default 'admin'::text,
    "twofa_secret" text,
    "notes" text,
    "created_by" uuid,
    "updated_at" timestamp with time zone default now(),
    "twofa_required" boolean default true,
    "twofa_configured" boolean default false
);


create table "public"."khipu_webhook_logs" (
    "id" uuid not null default gen_random_uuid(),
    "payment_id" character varying,
    "transaction_id" character varying,
    "status" character varying,
    "webhook_data" jsonb,
    "signature_header" text,
    "processed" boolean default false,
    "processed_at" timestamp with time zone,
    "error_message" text,
    "created_at" timestamp with time zone not null default now()
);


create table "public"."orders" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "items" jsonb not null,
    "subtotal" numeric not null default 0,
    "tax" numeric not null default 0,
    "shipping" numeric not null default 0,
    "total" numeric not null default 0,
    "currency" character varying not null default 'CLP'::character varying,
    "status" character varying not null default 'pending'::character varying,
    "payment_method" character varying,
    "payment_status" character varying not null default 'pending'::character varying,
    "shipping_address" jsonb,
    "billing_address" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "khipu_payment_id" character varying,
    "khipu_transaction_id" character varying,
    "khipu_payment_url" text,
    "khipu_expires_at" timestamp with time zone,
    "paid_at" timestamp with time zone
);


create table "public"."payment_transactions" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "payment_method" character varying not null,
    "external_payment_id" character varying,
    "external_transaction_id" character varying,
    "amount" numeric not null,
    "currency" character varying not null default 'CLP'::character varying,
    "status" character varying not null default 'pending'::character varying,
    "gateway_response" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "processed_at" timestamp with time zone
);


create table "public"."product_delivery_regions" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid not null,
    "region" text not null,
    "price" numeric not null,
    "delivery_days" integer not null
);


create table "public"."product_images" (
    "product_id" uuid not null,
    "image_url" text,
    "thumbnail_url" text,
    "thumbnails" jsonb
);


create table "public"."product_quantity_ranges" (
    "product_qty_id" uuid not null default gen_random_uuid(),
    "price" numeric not null default 0.00,
    "product_id" uuid,
    "min_quantity" integer not null,
    "max_quantity" integer
);


create table "public"."products" (
    "productnm" text not null,
    "supplier_id" uuid,
    "category" character varying,
    "description" text,
    "max_quantity" integer,
    "productid" uuid not null default gen_random_uuid(),
    "productqty" integer not null default 0,
    "price" numeric not null default 0.00,
    "minimum_purchase" integer default 1,
    "negotiable" boolean default false,
    "product_type" character varying default 'general'::character varying,
    "min_quantity" integer default 1,
    "spec_name" character varying not null default 'N/A'::character varying,
    "spec_value" text not null default 'N/A'::text,
    "is_active" boolean default true,
    "createddt" timestamp with time zone not null default now(),
    "updateddt" timestamp with time zone not null default now()
);


create table "public"."request_products" (
    "request_id" uuid,
    "product_id" uuid,
    "quantity" integer not null,
    "request_product_id" uuid not null default gen_random_uuid()
);


create table "public"."requests" (
    "delivery_country" text not null,
    "delivery_region" text not null,
    "delivery_commune" text not null,
    "delivery_direction" text not null,
    "delivery_direction_number" text not null,
    "delivery_direction_dept" text not null,
    "request_dt" date not null,
    "delivery_dt" date,
    "total_sale" numeric,
    "label" text not null,
    "buyer_id" uuid,
    "request_id" uuid not null default gen_random_uuid(),
    "created_dt" timestamp without time zone default now()
);


create table "public"."sales" (
    "user_id" uuid not null,
    "amount" numeric not null,
    "trx_date" timestamp with time zone default now(),
    "trx_id" uuid not null default gen_random_uuid()
);


create table "public"."shipping_info" (
    "user_id" uuid,
    "shipping_region" text,
    "shipping_commune" text,
    "shipping_address" text,
    "shipping_number" text,
    "shipping_dept" text
);


create table "public"."users" (
    "rut" character varying,
    "user_id" uuid not null,
    "email" text not null,
    "user_nm" character varying not null,
    "phone_nbr" character varying,
    "country" text not null,
    "logo_url" text,
    "main_supplier" boolean not null default false,
    "createdt" timestamp with time zone not null default now(),
    "updatedt" timestamp with time zone not null default now(),
    "descripcion_proveedor" text,
    "banned" boolean not null default false,
    "banned_at" timestamp with time zone,
    "banned_reason" text,
    "verified" boolean not null default false,
    "verified_at" timestamp with time zone,
    "verified_by" uuid,
    "last_ip" text
);


CREATE UNIQUE INDEX admin_audit_log_pkey ON public.admin_audit_log USING btree (id);

CREATE UNIQUE INDEX admin_sessions_pkey ON public.admin_sessions USING btree (session_id);

CREATE UNIQUE INDEX bank_info_user_id_key ON public.bank_info USING btree (user_id);

CREATE UNIQUE INDEX banned_ips_pkey ON public.banned_ips USING btree (ip);

CREATE UNIQUE INDEX billing_info_user_id_key ON public.billing_info USING btree (user_id);

CREATE UNIQUE INDEX cart_items_pkey ON public.cart_items USING btree (cart_items_id);

CREATE UNIQUE INDEX carts_pkey ON public.carts USING btree (cart_id);

CREATE UNIQUE INDEX control_panel_users_email_key ON public.control_panel_users USING btree (email);

CREATE UNIQUE INDEX control_panel_users_pkey ON public.control_panel_users USING btree (id);

CREATE UNIQUE INDEX control_panel_users_usuario_key ON public.control_panel_users USING btree (usuario);

CREATE UNIQUE INDEX khipu_webhook_logs_pkey ON public.khipu_webhook_logs USING btree (id);

CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);

CREATE UNIQUE INDEX payment_transactions_pkey ON public.payment_transactions USING btree (id);

CREATE UNIQUE INDEX product_delivery_regions_pkey ON public.product_delivery_regions USING btree (id);

CREATE UNIQUE INDEX product_delivery_regions_product_id_region_key ON public.product_delivery_regions USING btree (product_id, region);

CREATE UNIQUE INDEX product_quantity_ranges_pkey ON public.product_quantity_ranges USING btree (product_qty_id);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (productid);

CREATE UNIQUE INDEX request_products_pkey ON public.request_products USING btree (request_product_id);

CREATE UNIQUE INDEX requests_pkey ON public.requests USING btree (request_id);

CREATE UNIQUE INDEX sales_pkey ON public.sales USING btree (trx_id);

CREATE UNIQUE INDEX shipping_info_user_id_key ON public.shipping_info USING btree (user_id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (user_id);

alter table "public"."admin_audit_log" add constraint "admin_audit_log_pkey" PRIMARY KEY using index "admin_audit_log_pkey";

alter table "public"."admin_sessions" add constraint "admin_sessions_pkey" PRIMARY KEY using index "admin_sessions_pkey";

alter table "public"."banned_ips" add constraint "banned_ips_pkey" PRIMARY KEY using index "banned_ips_pkey";

alter table "public"."cart_items" add constraint "cart_items_pkey" PRIMARY KEY using index "cart_items_pkey";

alter table "public"."carts" add constraint "carts_pkey" PRIMARY KEY using index "carts_pkey";

alter table "public"."control_panel_users" add constraint "control_panel_users_pkey" PRIMARY KEY using index "control_panel_users_pkey";

alter table "public"."khipu_webhook_logs" add constraint "khipu_webhook_logs_pkey" PRIMARY KEY using index "khipu_webhook_logs_pkey";

alter table "public"."orders" add constraint "orders_pkey" PRIMARY KEY using index "orders_pkey";

alter table "public"."payment_transactions" add constraint "payment_transactions_pkey" PRIMARY KEY using index "payment_transactions_pkey";

alter table "public"."product_delivery_regions" add constraint "product_delivery_regions_pkey" PRIMARY KEY using index "product_delivery_regions_pkey";

alter table "public"."product_quantity_ranges" add constraint "product_quantity_ranges_pkey" PRIMARY KEY using index "product_quantity_ranges_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."request_products" add constraint "request_products_pkey" PRIMARY KEY using index "request_products_pkey";

alter table "public"."requests" add constraint "requests_pkey" PRIMARY KEY using index "requests_pkey";

alter table "public"."sales" add constraint "sales_pkey" PRIMARY KEY using index "sales_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."admin_audit_log" add constraint "admin_audit_log_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES control_panel_users(id) not valid;

alter table "public"."admin_audit_log" validate constraint "admin_audit_log_admin_id_fkey";

alter table "public"."admin_sessions" add constraint "admin_sessions_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES control_panel_users(id) not valid;

alter table "public"."admin_sessions" validate constraint "admin_sessions_admin_id_fkey";

alter table "public"."bank_info" add constraint "bank_info_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id) not valid;

alter table "public"."bank_info" validate constraint "bank_info_user_id_fkey";

alter table "public"."bank_info" add constraint "bank_info_user_id_key" UNIQUE using index "bank_info_user_id_key";

alter table "public"."banned_ips" add constraint "banned_ips_banned_by_fkey" FOREIGN KEY (banned_by) REFERENCES control_panel_users(id) not valid;

alter table "public"."banned_ips" validate constraint "banned_ips_banned_by_fkey";

alter table "public"."billing_info" add constraint "billing_info_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id) not valid;

alter table "public"."billing_info" validate constraint "billing_info_user_id_fkey";

alter table "public"."billing_info" add constraint "billing_info_user_id_key" UNIQUE using index "billing_info_user_id_key";

alter table "public"."cart_items" add constraint "cart_items_cart_id_fkey" FOREIGN KEY (cart_id) REFERENCES carts(cart_id) not valid;

alter table "public"."cart_items" validate constraint "cart_items_cart_id_fkey";

alter table "public"."cart_items" add constraint "cart_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(productid) ON DELETE CASCADE not valid;

alter table "public"."cart_items" validate constraint "cart_items_product_id_fkey";

alter table "public"."cart_items" add constraint "cart_items_quantity_check" CHECK ((quantity > 0)) not valid;

alter table "public"."cart_items" validate constraint "cart_items_quantity_check";

alter table "public"."carts" add constraint "carts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id) not valid;

alter table "public"."carts" validate constraint "carts_user_id_fkey";

alter table "public"."control_panel_users" add constraint "control_panel_users_email_key" UNIQUE using index "control_panel_users_email_key";

alter table "public"."control_panel_users" add constraint "control_panel_users_role_check" CHECK ((role = 'admin'::text)) not valid;

alter table "public"."control_panel_users" validate constraint "control_panel_users_role_check";

alter table "public"."control_panel_users" add constraint "control_panel_users_usuario_key" UNIQUE using index "control_panel_users_usuario_key";

alter table "public"."orders" add constraint "orders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id) not valid;

alter table "public"."orders" validate constraint "orders_user_id_fkey";

alter table "public"."payment_transactions" add constraint "payment_transactions_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) not valid;

alter table "public"."payment_transactions" validate constraint "payment_transactions_order_id_fkey";

alter table "public"."product_delivery_regions" add constraint "product_delivery_regions_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(productid) ON DELETE CASCADE not valid;

alter table "public"."product_delivery_regions" validate constraint "product_delivery_regions_product_id_fkey";

alter table "public"."product_delivery_regions" add constraint "product_delivery_regions_product_id_region_key" UNIQUE using index "product_delivery_regions_product_id_region_key";

alter table "public"."product_images" add constraint "product_images_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(productid) ON DELETE CASCADE not valid;

alter table "public"."product_images" validate constraint "product_images_product_id_fkey";

alter table "public"."product_quantity_ranges" add constraint "product_quantity_ranges_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(productid) ON DELETE CASCADE not valid;

alter table "public"."product_quantity_ranges" validate constraint "product_quantity_ranges_product_id_fkey";

alter table "public"."products" add constraint "products_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES users(user_id) not valid;

alter table "public"."products" validate constraint "products_supplier_id_fkey";

alter table "public"."request_products" add constraint "request_products_request_id_fkey" FOREIGN KEY (request_id) REFERENCES requests(request_id) not valid;

alter table "public"."request_products" validate constraint "request_products_request_id_fkey";

alter table "public"."requests" add constraint "requests_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES users(user_id) not valid;

alter table "public"."requests" validate constraint "requests_buyer_id_fkey";

alter table "public"."sales" add constraint "sales_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id) not valid;

alter table "public"."sales" validate constraint "sales_user_id_fkey";

alter table "public"."shipping_info" add constraint "shipping_info_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id) not valid;

alter table "public"."shipping_info" validate constraint "shipping_info_user_id_fkey";

alter table "public"."shipping_info" add constraint "shipping_info_user_id_key" UNIQUE using index "shipping_info_user_id_key";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."users" validate constraint "users_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.ban_user(target_user_id uuid, admin_reason text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$BEGIN
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
END;$function$
;

CREATE OR REPLACE FUNCTION public.clean_expired_admin_sessions()
 RETURNS void
 LANGUAGE plpgsql
AS $function$BEGIN
  UPDATE admin_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
END;$function$
;

CREATE OR REPLACE FUNCTION public.get_banned_users()
 RETURNS TABLE(user_id uuid, user_name text, email text, banned_at timestamp with time zone, banned_reason text, days_banned integer)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_ban_info(target_user_id uuid)
 RETURNS TABLE(user_id uuid, user_name text, email text, is_banned boolean, banned_at timestamp with time zone, banned_reason text, days_banned integer)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
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
END;$function$
;

CREATE OR REPLACE FUNCTION public.handle_user_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
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
END;$function$
;

CREATE OR REPLACE FUNCTION public.unban_user(target_user_id uuid, admin_reason text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$BEGIN
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
END;$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$function$
;

grant delete on table "public"."admin_audit_log" to "anon";

grant insert on table "public"."admin_audit_log" to "anon";

grant references on table "public"."admin_audit_log" to "anon";

grant select on table "public"."admin_audit_log" to "anon";

grant trigger on table "public"."admin_audit_log" to "anon";

grant truncate on table "public"."admin_audit_log" to "anon";

grant update on table "public"."admin_audit_log" to "anon";

grant delete on table "public"."admin_audit_log" to "authenticated";

grant insert on table "public"."admin_audit_log" to "authenticated";

grant references on table "public"."admin_audit_log" to "authenticated";

grant select on table "public"."admin_audit_log" to "authenticated";

grant trigger on table "public"."admin_audit_log" to "authenticated";

grant truncate on table "public"."admin_audit_log" to "authenticated";

grant update on table "public"."admin_audit_log" to "authenticated";

grant delete on table "public"."admin_audit_log" to "service_role";

grant insert on table "public"."admin_audit_log" to "service_role";

grant references on table "public"."admin_audit_log" to "service_role";

grant select on table "public"."admin_audit_log" to "service_role";

grant trigger on table "public"."admin_audit_log" to "service_role";

grant truncate on table "public"."admin_audit_log" to "service_role";

grant update on table "public"."admin_audit_log" to "service_role";

grant delete on table "public"."admin_sessions" to "anon";

grant insert on table "public"."admin_sessions" to "anon";

grant references on table "public"."admin_sessions" to "anon";

grant select on table "public"."admin_sessions" to "anon";

grant trigger on table "public"."admin_sessions" to "anon";

grant truncate on table "public"."admin_sessions" to "anon";

grant update on table "public"."admin_sessions" to "anon";

grant delete on table "public"."admin_sessions" to "authenticated";

grant insert on table "public"."admin_sessions" to "authenticated";

grant references on table "public"."admin_sessions" to "authenticated";

grant select on table "public"."admin_sessions" to "authenticated";

grant trigger on table "public"."admin_sessions" to "authenticated";

grant truncate on table "public"."admin_sessions" to "authenticated";

grant update on table "public"."admin_sessions" to "authenticated";

grant delete on table "public"."admin_sessions" to "service_role";

grant insert on table "public"."admin_sessions" to "service_role";

grant references on table "public"."admin_sessions" to "service_role";

grant select on table "public"."admin_sessions" to "service_role";

grant trigger on table "public"."admin_sessions" to "service_role";

grant truncate on table "public"."admin_sessions" to "service_role";

grant update on table "public"."admin_sessions" to "service_role";

grant delete on table "public"."bank_info" to "anon";

grant insert on table "public"."bank_info" to "anon";

grant references on table "public"."bank_info" to "anon";

grant select on table "public"."bank_info" to "anon";

grant trigger on table "public"."bank_info" to "anon";

grant truncate on table "public"."bank_info" to "anon";

grant update on table "public"."bank_info" to "anon";

grant delete on table "public"."bank_info" to "authenticated";

grant insert on table "public"."bank_info" to "authenticated";

grant references on table "public"."bank_info" to "authenticated";

grant select on table "public"."bank_info" to "authenticated";

grant trigger on table "public"."bank_info" to "authenticated";

grant truncate on table "public"."bank_info" to "authenticated";

grant update on table "public"."bank_info" to "authenticated";

grant delete on table "public"."bank_info" to "service_role";

grant insert on table "public"."bank_info" to "service_role";

grant references on table "public"."bank_info" to "service_role";

grant select on table "public"."bank_info" to "service_role";

grant trigger on table "public"."bank_info" to "service_role";

grant truncate on table "public"."bank_info" to "service_role";

grant update on table "public"."bank_info" to "service_role";

grant delete on table "public"."banned_ips" to "anon";

grant insert on table "public"."banned_ips" to "anon";

grant references on table "public"."banned_ips" to "anon";

grant select on table "public"."banned_ips" to "anon";

grant trigger on table "public"."banned_ips" to "anon";

grant truncate on table "public"."banned_ips" to "anon";

grant update on table "public"."banned_ips" to "anon";

grant delete on table "public"."banned_ips" to "authenticated";

grant insert on table "public"."banned_ips" to "authenticated";

grant references on table "public"."banned_ips" to "authenticated";

grant select on table "public"."banned_ips" to "authenticated";

grant trigger on table "public"."banned_ips" to "authenticated";

grant truncate on table "public"."banned_ips" to "authenticated";

grant update on table "public"."banned_ips" to "authenticated";

grant delete on table "public"."banned_ips" to "service_role";

grant insert on table "public"."banned_ips" to "service_role";

grant references on table "public"."banned_ips" to "service_role";

grant select on table "public"."banned_ips" to "service_role";

grant trigger on table "public"."banned_ips" to "service_role";

grant truncate on table "public"."banned_ips" to "service_role";

grant update on table "public"."banned_ips" to "service_role";

grant delete on table "public"."billing_info" to "anon";

grant insert on table "public"."billing_info" to "anon";

grant references on table "public"."billing_info" to "anon";

grant select on table "public"."billing_info" to "anon";

grant trigger on table "public"."billing_info" to "anon";

grant truncate on table "public"."billing_info" to "anon";

grant update on table "public"."billing_info" to "anon";

grant delete on table "public"."billing_info" to "authenticated";

grant insert on table "public"."billing_info" to "authenticated";

grant references on table "public"."billing_info" to "authenticated";

grant select on table "public"."billing_info" to "authenticated";

grant trigger on table "public"."billing_info" to "authenticated";

grant truncate on table "public"."billing_info" to "authenticated";

grant update on table "public"."billing_info" to "authenticated";

grant delete on table "public"."billing_info" to "service_role";

grant insert on table "public"."billing_info" to "service_role";

grant references on table "public"."billing_info" to "service_role";

grant select on table "public"."billing_info" to "service_role";

grant trigger on table "public"."billing_info" to "service_role";

grant truncate on table "public"."billing_info" to "service_role";

grant update on table "public"."billing_info" to "service_role";

grant delete on table "public"."cart_items" to "anon";

grant insert on table "public"."cart_items" to "anon";

grant references on table "public"."cart_items" to "anon";

grant select on table "public"."cart_items" to "anon";

grant trigger on table "public"."cart_items" to "anon";

grant truncate on table "public"."cart_items" to "anon";

grant update on table "public"."cart_items" to "anon";

grant delete on table "public"."cart_items" to "authenticated";

grant insert on table "public"."cart_items" to "authenticated";

grant references on table "public"."cart_items" to "authenticated";

grant select on table "public"."cart_items" to "authenticated";

grant trigger on table "public"."cart_items" to "authenticated";

grant truncate on table "public"."cart_items" to "authenticated";

grant update on table "public"."cart_items" to "authenticated";

grant delete on table "public"."cart_items" to "service_role";

grant insert on table "public"."cart_items" to "service_role";

grant references on table "public"."cart_items" to "service_role";

grant select on table "public"."cart_items" to "service_role";

grant trigger on table "public"."cart_items" to "service_role";

grant truncate on table "public"."cart_items" to "service_role";

grant update on table "public"."cart_items" to "service_role";

grant delete on table "public"."carts" to "anon";

grant insert on table "public"."carts" to "anon";

grant references on table "public"."carts" to "anon";

grant select on table "public"."carts" to "anon";

grant trigger on table "public"."carts" to "anon";

grant truncate on table "public"."carts" to "anon";

grant update on table "public"."carts" to "anon";

grant delete on table "public"."carts" to "authenticated";

grant insert on table "public"."carts" to "authenticated";

grant references on table "public"."carts" to "authenticated";

grant select on table "public"."carts" to "authenticated";

grant trigger on table "public"."carts" to "authenticated";

grant truncate on table "public"."carts" to "authenticated";

grant update on table "public"."carts" to "authenticated";

grant delete on table "public"."carts" to "service_role";

grant insert on table "public"."carts" to "service_role";

grant references on table "public"."carts" to "service_role";

grant select on table "public"."carts" to "service_role";

grant trigger on table "public"."carts" to "service_role";

grant truncate on table "public"."carts" to "service_role";

grant update on table "public"."carts" to "service_role";

grant delete on table "public"."control_panel_users" to "anon";

grant insert on table "public"."control_panel_users" to "anon";

grant references on table "public"."control_panel_users" to "anon";

grant select on table "public"."control_panel_users" to "anon";

grant trigger on table "public"."control_panel_users" to "anon";

grant truncate on table "public"."control_panel_users" to "anon";

grant update on table "public"."control_panel_users" to "anon";

grant delete on table "public"."control_panel_users" to "authenticated";

grant insert on table "public"."control_panel_users" to "authenticated";

grant references on table "public"."control_panel_users" to "authenticated";

grant select on table "public"."control_panel_users" to "authenticated";

grant trigger on table "public"."control_panel_users" to "authenticated";

grant truncate on table "public"."control_panel_users" to "authenticated";

grant update on table "public"."control_panel_users" to "authenticated";

grant delete on table "public"."control_panel_users" to "service_role";

grant insert on table "public"."control_panel_users" to "service_role";

grant references on table "public"."control_panel_users" to "service_role";

grant select on table "public"."control_panel_users" to "service_role";

grant trigger on table "public"."control_panel_users" to "service_role";

grant truncate on table "public"."control_panel_users" to "service_role";

grant update on table "public"."control_panel_users" to "service_role";

grant delete on table "public"."khipu_webhook_logs" to "anon";

grant insert on table "public"."khipu_webhook_logs" to "anon";

grant references on table "public"."khipu_webhook_logs" to "anon";

grant select on table "public"."khipu_webhook_logs" to "anon";

grant trigger on table "public"."khipu_webhook_logs" to "anon";

grant truncate on table "public"."khipu_webhook_logs" to "anon";

grant update on table "public"."khipu_webhook_logs" to "anon";

grant delete on table "public"."khipu_webhook_logs" to "authenticated";

grant insert on table "public"."khipu_webhook_logs" to "authenticated";

grant references on table "public"."khipu_webhook_logs" to "authenticated";

grant select on table "public"."khipu_webhook_logs" to "authenticated";

grant trigger on table "public"."khipu_webhook_logs" to "authenticated";

grant truncate on table "public"."khipu_webhook_logs" to "authenticated";

grant update on table "public"."khipu_webhook_logs" to "authenticated";

grant delete on table "public"."khipu_webhook_logs" to "service_role";

grant insert on table "public"."khipu_webhook_logs" to "service_role";

grant references on table "public"."khipu_webhook_logs" to "service_role";

grant select on table "public"."khipu_webhook_logs" to "service_role";

grant trigger on table "public"."khipu_webhook_logs" to "service_role";

grant truncate on table "public"."khipu_webhook_logs" to "service_role";

grant update on table "public"."khipu_webhook_logs" to "service_role";

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant references on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant trigger on table "public"."orders" to "anon";

grant truncate on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant references on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant trigger on table "public"."orders" to "authenticated";

grant truncate on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."payment_transactions" to "anon";

grant insert on table "public"."payment_transactions" to "anon";

grant references on table "public"."payment_transactions" to "anon";

grant select on table "public"."payment_transactions" to "anon";

grant trigger on table "public"."payment_transactions" to "anon";

grant truncate on table "public"."payment_transactions" to "anon";

grant update on table "public"."payment_transactions" to "anon";

grant delete on table "public"."payment_transactions" to "authenticated";

grant insert on table "public"."payment_transactions" to "authenticated";

grant references on table "public"."payment_transactions" to "authenticated";

grant select on table "public"."payment_transactions" to "authenticated";

grant trigger on table "public"."payment_transactions" to "authenticated";

grant truncate on table "public"."payment_transactions" to "authenticated";

grant update on table "public"."payment_transactions" to "authenticated";

grant delete on table "public"."payment_transactions" to "service_role";

grant insert on table "public"."payment_transactions" to "service_role";

grant references on table "public"."payment_transactions" to "service_role";

grant select on table "public"."payment_transactions" to "service_role";

grant trigger on table "public"."payment_transactions" to "service_role";

grant truncate on table "public"."payment_transactions" to "service_role";

grant update on table "public"."payment_transactions" to "service_role";

grant delete on table "public"."product_delivery_regions" to "anon";

grant insert on table "public"."product_delivery_regions" to "anon";

grant references on table "public"."product_delivery_regions" to "anon";

grant select on table "public"."product_delivery_regions" to "anon";

grant trigger on table "public"."product_delivery_regions" to "anon";

grant truncate on table "public"."product_delivery_regions" to "anon";

grant update on table "public"."product_delivery_regions" to "anon";

grant delete on table "public"."product_delivery_regions" to "authenticated";

grant insert on table "public"."product_delivery_regions" to "authenticated";

grant references on table "public"."product_delivery_regions" to "authenticated";

grant select on table "public"."product_delivery_regions" to "authenticated";

grant trigger on table "public"."product_delivery_regions" to "authenticated";

grant truncate on table "public"."product_delivery_regions" to "authenticated";

grant update on table "public"."product_delivery_regions" to "authenticated";

grant delete on table "public"."product_delivery_regions" to "service_role";

grant insert on table "public"."product_delivery_regions" to "service_role";

grant references on table "public"."product_delivery_regions" to "service_role";

grant select on table "public"."product_delivery_regions" to "service_role";

grant trigger on table "public"."product_delivery_regions" to "service_role";

grant truncate on table "public"."product_delivery_regions" to "service_role";

grant update on table "public"."product_delivery_regions" to "service_role";

grant delete on table "public"."product_images" to "anon";

grant insert on table "public"."product_images" to "anon";

grant references on table "public"."product_images" to "anon";

grant select on table "public"."product_images" to "anon";

grant trigger on table "public"."product_images" to "anon";

grant truncate on table "public"."product_images" to "anon";

grant update on table "public"."product_images" to "anon";

grant delete on table "public"."product_images" to "authenticated";

grant insert on table "public"."product_images" to "authenticated";

grant references on table "public"."product_images" to "authenticated";

grant select on table "public"."product_images" to "authenticated";

grant trigger on table "public"."product_images" to "authenticated";

grant truncate on table "public"."product_images" to "authenticated";

grant update on table "public"."product_images" to "authenticated";

grant delete on table "public"."product_images" to "service_role";

grant insert on table "public"."product_images" to "service_role";

grant references on table "public"."product_images" to "service_role";

grant select on table "public"."product_images" to "service_role";

grant trigger on table "public"."product_images" to "service_role";

grant truncate on table "public"."product_images" to "service_role";

grant update on table "public"."product_images" to "service_role";

grant delete on table "public"."product_quantity_ranges" to "anon";

grant insert on table "public"."product_quantity_ranges" to "anon";

grant references on table "public"."product_quantity_ranges" to "anon";

grant select on table "public"."product_quantity_ranges" to "anon";

grant trigger on table "public"."product_quantity_ranges" to "anon";

grant truncate on table "public"."product_quantity_ranges" to "anon";

grant update on table "public"."product_quantity_ranges" to "anon";

grant delete on table "public"."product_quantity_ranges" to "authenticated";

grant insert on table "public"."product_quantity_ranges" to "authenticated";

grant references on table "public"."product_quantity_ranges" to "authenticated";

grant select on table "public"."product_quantity_ranges" to "authenticated";

grant trigger on table "public"."product_quantity_ranges" to "authenticated";

grant truncate on table "public"."product_quantity_ranges" to "authenticated";

grant update on table "public"."product_quantity_ranges" to "authenticated";

grant delete on table "public"."product_quantity_ranges" to "service_role";

grant insert on table "public"."product_quantity_ranges" to "service_role";

grant references on table "public"."product_quantity_ranges" to "service_role";

grant select on table "public"."product_quantity_ranges" to "service_role";

grant trigger on table "public"."product_quantity_ranges" to "service_role";

grant truncate on table "public"."product_quantity_ranges" to "service_role";

grant update on table "public"."product_quantity_ranges" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."request_products" to "anon";

grant insert on table "public"."request_products" to "anon";

grant references on table "public"."request_products" to "anon";

grant select on table "public"."request_products" to "anon";

grant trigger on table "public"."request_products" to "anon";

grant truncate on table "public"."request_products" to "anon";

grant update on table "public"."request_products" to "anon";

grant delete on table "public"."request_products" to "authenticated";

grant insert on table "public"."request_products" to "authenticated";

grant references on table "public"."request_products" to "authenticated";

grant select on table "public"."request_products" to "authenticated";

grant trigger on table "public"."request_products" to "authenticated";

grant truncate on table "public"."request_products" to "authenticated";

grant update on table "public"."request_products" to "authenticated";

grant delete on table "public"."request_products" to "service_role";

grant insert on table "public"."request_products" to "service_role";

grant references on table "public"."request_products" to "service_role";

grant select on table "public"."request_products" to "service_role";

grant trigger on table "public"."request_products" to "service_role";

grant truncate on table "public"."request_products" to "service_role";

grant update on table "public"."request_products" to "service_role";

grant delete on table "public"."requests" to "anon";

grant insert on table "public"."requests" to "anon";

grant references on table "public"."requests" to "anon";

grant select on table "public"."requests" to "anon";

grant trigger on table "public"."requests" to "anon";

grant truncate on table "public"."requests" to "anon";

grant update on table "public"."requests" to "anon";

grant delete on table "public"."requests" to "authenticated";

grant insert on table "public"."requests" to "authenticated";

grant references on table "public"."requests" to "authenticated";

grant select on table "public"."requests" to "authenticated";

grant trigger on table "public"."requests" to "authenticated";

grant truncate on table "public"."requests" to "authenticated";

grant update on table "public"."requests" to "authenticated";

grant delete on table "public"."requests" to "service_role";

grant insert on table "public"."requests" to "service_role";

grant references on table "public"."requests" to "service_role";

grant select on table "public"."requests" to "service_role";

grant trigger on table "public"."requests" to "service_role";

grant truncate on table "public"."requests" to "service_role";

grant update on table "public"."requests" to "service_role";

grant delete on table "public"."sales" to "anon";

grant insert on table "public"."sales" to "anon";

grant references on table "public"."sales" to "anon";

grant select on table "public"."sales" to "anon";

grant trigger on table "public"."sales" to "anon";

grant truncate on table "public"."sales" to "anon";

grant update on table "public"."sales" to "anon";

grant delete on table "public"."sales" to "authenticated";

grant insert on table "public"."sales" to "authenticated";

grant references on table "public"."sales" to "authenticated";

grant select on table "public"."sales" to "authenticated";

grant trigger on table "public"."sales" to "authenticated";

grant truncate on table "public"."sales" to "authenticated";

grant update on table "public"."sales" to "authenticated";

grant delete on table "public"."sales" to "service_role";

grant insert on table "public"."sales" to "service_role";

grant references on table "public"."sales" to "service_role";

grant select on table "public"."sales" to "service_role";

grant trigger on table "public"."sales" to "service_role";

grant truncate on table "public"."sales" to "service_role";

grant update on table "public"."sales" to "service_role";

grant delete on table "public"."shipping_info" to "anon";

grant insert on table "public"."shipping_info" to "anon";

grant references on table "public"."shipping_info" to "anon";

grant select on table "public"."shipping_info" to "anon";

grant trigger on table "public"."shipping_info" to "anon";

grant truncate on table "public"."shipping_info" to "anon";

grant update on table "public"."shipping_info" to "anon";

grant delete on table "public"."shipping_info" to "authenticated";

grant insert on table "public"."shipping_info" to "authenticated";

grant references on table "public"."shipping_info" to "authenticated";

grant select on table "public"."shipping_info" to "authenticated";

grant trigger on table "public"."shipping_info" to "authenticated";

grant truncate on table "public"."shipping_info" to "authenticated";

grant update on table "public"."shipping_info" to "authenticated";

grant delete on table "public"."shipping_info" to "service_role";

grant insert on table "public"."shipping_info" to "service_role";

grant references on table "public"."shipping_info" to "service_role";

grant select on table "public"."shipping_info" to "service_role";

grant trigger on table "public"."shipping_info" to "service_role";

grant truncate on table "public"."shipping_info" to "service_role";

grant update on table "public"."shipping_info" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

CREATE TRIGGER update_control_panel_users_updated_at BEFORE UPDATE ON public.control_panel_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


