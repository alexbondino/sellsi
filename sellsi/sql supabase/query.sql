-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  createddt timestamp with time zone DEFAULT now(),
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid)
);
CREATE TABLE public.product_price_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  min_quantity integer NOT NULL,
  max_quantity integer,
  price numeric NOT NULL,
  createddt timestamp with time zone DEFAULT now(),
  CONSTRAINT product_price_tiers_pkey PRIMARY KEY (id),
  CONSTRAINT product_price_tiers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid)
);
CREATE TABLE public.product_specifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  category character varying NOT NULL,
  spec_name character varying NOT NULL,
  spec_value text NOT NULL,
  createddt timestamp with time zone DEFAULT now(),
  CONSTRAINT product_specifications_pkey PRIMARY KEY (id),
  CONSTRAINT product_specifications_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid)
);
CREATE TABLE public.products (
  productid uuid NOT NULL DEFAULT gen_random_uuid(),
  productnm text NOT NULL,
  productqty integer NOT NULL,
  supplier_id uuid,
  createddt timestamp with time zone DEFAULT now(),
  updateddt timestamp with time zone DEFAULT now(),
  price numeric NOT NULL,
  category character varying,
  minimum_purchase integer DEFAULT 1,
  negotiable boolean DEFAULT false,
  product_type character varying DEFAULT 'general'::character varying,
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  CONSTRAINT products_pkey PRIMARY KEY (productid),
  CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.requests (
  requestid uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_id uuid,
  productid uuid,
  productqty integer NOT NULL,
  createddt timestamp with time zone DEFAULT now(),
  updateddt timestamp with time zone DEFAULT now(),
  CONSTRAINT requests_pkey PRIMARY KEY (requestid),
  CONSTRAINT requests_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(user_id),
  CONSTRAINT requests_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid)
);
CREATE TABLE public.sales (
  trx_date timestamp with time zone DEFAULT now(),
  trx_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  amount integer NOT NULL,
  CONSTRAINT sales_pkey PRIMARY KEY (trx_id),
  CONSTRAINT sales_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.users (
  user_id uuid NOT NULL,
  main_supplier boolean NOT NULL,
  email text NOT NULL UNIQUE,
  user_nm character varying NOT NULL,
  phone_nbr character varying,
  country text NOT NULL,
  createdt timestamp with time zone NOT NULL DEFAULT now(),
  updatedt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  correo text NOT NULL UNIQUE,
  creado_en timestamp without time zone DEFAULT now(),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);