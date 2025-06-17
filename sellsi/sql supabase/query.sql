-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.product_images (
  product_id uuid NOT NULL,
  image_url text,
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid)
);
CREATE TABLE public.product_quantity_ranges (
  product_qty_id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  min_quantity integer NOT NULL,
  max_quantity integer,
  price numeric NOT NULL DEFAULT 0.00,
  CONSTRAINT product_quantity_ranges_pkey PRIMARY KEY (product_qty_id),
  CONSTRAINT product_quantity_ranges_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid)
);
CREATE TABLE public.products (
  productid uuid NOT NULL DEFAULT gen_random_uuid(),
  productnm text NOT NULL,
  productqty integer NOT NULL DEFAULT 0,
  supplier_id uuid,
  price numeric NOT NULL DEFAULT 0.00,
  category character varying,
  minimum_purchase integer DEFAULT 1,
  negotiable boolean DEFAULT false,
  product_type character varying DEFAULT 'general'::character varying,
  description text,
  min_quantity integer DEFAULT 1,
  max_quantity integer,
  spec_name character varying NOT NULL DEFAULT 'N/A'::character varying,
  spec_value text NOT NULL DEFAULT 'N/A'::text,
  is_active boolean DEFAULT true,
  createddt timestamp with time zone DEFAULT now(),
  updateddt timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (productid),
  CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.requests (
  requestid uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  productid uuid NOT NULL,
  productqty integer NOT NULL,
  createddt timestamp with time zone DEFAULT now(),
  updateddt timestamp with time zone DEFAULT now(),
  CONSTRAINT requests_pkey PRIMARY KEY (requestid),
  CONSTRAINT requests_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid),
  CONSTRAINT requests_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.sales (
  trx_date timestamp with time zone DEFAULT now(),
  trx_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  CONSTRAINT sales_pkey PRIMARY KEY (trx_id),
  CONSTRAINT sales_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.users (
  user_id uuid NOT NULL,
  main_supplier boolean NOT NULL DEFAULT false,
  email text NOT NULL UNIQUE,
  user_nm character varying NOT NULL,
  phone_nbr character varying,
  country text NOT NULL,
  createdt timestamp with time zone NOT NULL DEFAULT now(),
  updatedt timestamp with time zone NOT NULL DEFAULT now(),
  logo_url text,
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);