-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_id uuid,
  details jsonb,
  timestamp timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text,
  CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT admin_audit_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.control_panel_users(id)
);
CREATE TABLE public.admin_sessions (
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  ip_address text,
  user_agent text,
  is_active boolean DEFAULT true,
  CONSTRAINT admin_sessions_pkey PRIMARY KEY (session_id),
  CONSTRAINT admin_sessions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.control_panel_users(id)
);
CREATE TABLE public.bank_info (
  user_id uuid UNIQUE,
  account_holder character varying,
  bank character varying,
  account_number character varying,
  transfer_rut character varying,
  confirmation_email text,
  account_type character varying DEFAULT 'corriente'::character varying,
  CONSTRAINT bank_info_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.banned_ips (
  ip text NOT NULL,
  banned_at timestamp with time zone DEFAULT now(),
  banned_reason text,
  banned_by uuid,
  CONSTRAINT banned_ips_pkey PRIMARY KEY (ip),
  CONSTRAINT banned_ips_banned_by_fkey FOREIGN KEY (banned_by) REFERENCES public.control_panel_users(id)
);
CREATE TABLE public.billing_info (
  user_id uuid UNIQUE,
  business_name character varying,
  billing_rut character varying,
  business_line character varying,
  billing_address text,
  billing_region text,
  billing_commune text,
  CONSTRAINT billing_info_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.cart_items (
  cart_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_addition numeric,
  price_tiers jsonb,
  cart_items_id uuid NOT NULL DEFAULT gen_random_uuid(),
  added_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (cart_items_id),
  CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(cart_id),
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid)
);
CREATE TABLE public.carts (
  user_id uuid NOT NULL,
  cart_id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT carts_pkey PRIMARY KEY (cart_id),
  CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.control_panel_users (
  usuario text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  last_login timestamp with time zone,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  email text UNIQUE,
  full_name text,
  role text DEFAULT 'admin'::text CHECK (role = 'admin'::text),
  twofa_secret text,
  notes text,
  created_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  twofa_required boolean DEFAULT true,
  twofa_configured boolean DEFAULT false,
  CONSTRAINT control_panel_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ejemplo (
  id bigint NOT NULL DEFAULT nextval('ejemplo_id_seq'::regclass),
  nombre text,
  CONSTRAINT ejemplo_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ejemplo_prueba (
  id bigint NOT NULL DEFAULT nextval('ejemplo_prueba_id_seq'::regclass),
  nombre text,
  CONSTRAINT ejemplo_prueba_pkey PRIMARY KEY (id)
);
CREATE TABLE public.khipu_webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id character varying,
  transaction_id character varying,
  status character varying,
  webhook_data jsonb,
  signature_header text,
  processed boolean DEFAULT false,
  processed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT khipu_webhook_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  shipping numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency character varying NOT NULL DEFAULT 'CLP'::character varying,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  payment_method character varying,
  payment_status character varying NOT NULL DEFAULT 'pending'::character varying,
  shipping_address jsonb,
  billing_address jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  khipu_payment_id character varying,
  khipu_transaction_id character varying,
  khipu_payment_url text,
  khipu_expires_at timestamp with time zone,
  paid_at timestamp with time zone,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  payment_method character varying NOT NULL,
  external_payment_id character varying,
  external_transaction_id character varying,
  amount numeric NOT NULL,
  currency character varying NOT NULL DEFAULT 'CLP'::character varying,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  gateway_response jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.product_delivery_regions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  region text NOT NULL,
  price numeric NOT NULL,
  delivery_days integer NOT NULL,
  CONSTRAINT product_delivery_regions_pkey PRIMARY KEY (id),
  CONSTRAINT product_delivery_regions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid)
);
CREATE TABLE public.product_images (
  product_id uuid NOT NULL,
  image_url text,
  thumbnail_url text,
  thumbnails jsonb,
  image_order integer DEFAULT 0,
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid)
);
CREATE TABLE public.product_quantity_ranges (
  product_qty_id uuid NOT NULL DEFAULT gen_random_uuid(),
  price numeric NOT NULL DEFAULT 0.00,
  product_id uuid,
  min_quantity integer NOT NULL,
  max_quantity integer,
  CONSTRAINT product_quantity_ranges_pkey PRIMARY KEY (product_qty_id),
  CONSTRAINT product_quantity_ranges_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid)
);
CREATE TABLE public.products (
  productnm text NOT NULL,
  supplier_id uuid,
  category character varying,
  description text,
  max_quantity integer,
  productid uuid NOT NULL DEFAULT gen_random_uuid(),
  productqty integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0.00,
  minimum_purchase integer DEFAULT 1,
  negotiable boolean DEFAULT false,
  product_type character varying DEFAULT 'general'::character varying,
  min_quantity integer DEFAULT 1,
  spec_name character varying NOT NULL DEFAULT 'N/A'::character varying,
  spec_value text NOT NULL DEFAULT 'N/A'::text,
  is_active boolean DEFAULT true,
  createddt timestamp with time zone NOT NULL DEFAULT now(),
  updateddt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (productid),
  CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.request_products (
  request_id uuid,
  product_id uuid,
  quantity integer NOT NULL,
  request_product_id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT request_products_pkey PRIMARY KEY (request_product_id),
  CONSTRAINT request_products_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(request_id)
);
CREATE TABLE public.requests (
  delivery_country text NOT NULL,
  delivery_region text NOT NULL,
  delivery_commune text NOT NULL,
  delivery_direction text NOT NULL,
  delivery_direction_number text NOT NULL,
  delivery_direction_dept text NOT NULL,
  request_dt date NOT NULL,
  delivery_dt date,
  total_sale numeric,
  label text NOT NULL,
  buyer_id uuid,
  request_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_dt timestamp without time zone DEFAULT now(),
  CONSTRAINT requests_pkey PRIMARY KEY (request_id),
  CONSTRAINT requests_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.sales (
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  trx_date timestamp with time zone DEFAULT now(),
  trx_id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT sales_pkey PRIMARY KEY (trx_id),
  CONSTRAINT sales_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.shipping_info (
  user_id uuid UNIQUE,
  shipping_region text,
  shipping_commune text,
  shipping_address text,
  shipping_number text,
  shipping_dept text,
  CONSTRAINT shipping_info_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.storage_cleanup_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  executed_at timestamp with time zone NOT NULL DEFAULT now(),
  products_processed integer NOT NULL DEFAULT 0,
  files_removed integer NOT NULL DEFAULT 0,
  execution_time_ms integer NOT NULL DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  success boolean NOT NULL DEFAULT true,
  trigger_type text DEFAULT 'scheduled'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT storage_cleanup_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  rut character varying,
  user_id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  user_nm character varying NOT NULL,
  phone_nbr character varying,
  country text NOT NULL,
  logo_url text,
  main_supplier boolean NOT NULL DEFAULT false,
  createdt timestamp with time zone NOT NULL DEFAULT now(),
  updatedt timestamp with time zone NOT NULL DEFAULT now(),
  descripcion_proveedor text,
  banned boolean NOT NULL DEFAULT false,
  banned_at timestamp with time zone,
  banned_reason text,
  verified boolean NOT NULL DEFAULT false,
  verified_at timestamp with time zone,
  verified_by uuid,
  last_ip text,
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);