-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

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
CREATE TABLE public.product_images (
  product_id uuid NOT NULL,
  image_url text,
  thumbnail_url text,
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
  createddt timestamp with time zone DEFAULT now(),
  updateddt timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (productid),
  CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.request_products (
  request_id uuid,
  product_id uuid,
  quantity integer NOT NULL,
  request_product_id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT request_products_pkey PRIMARY KEY (request_product_id),
  CONSTRAINT request_products_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(request_id),
  CONSTRAINT request_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid)
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
CREATE TABLE public.users (
  user_id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  user_nm character varying NOT NULL,
  phone_nbr character varying,
  country text NOT NULL,
  logo_url text,
  main_supplier boolean NOT NULL DEFAULT false,
  createdt timestamp with time zone NOT NULL DEFAULT now(),
  updatedt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

