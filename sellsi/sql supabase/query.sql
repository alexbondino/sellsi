-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.products (
  productid uuid NOT NULL DEFAULT gen_random_uuid(),
  productnm text NOT NULL,
  productqty integer NOT NULL,
  supplier_id uuid,
  createddt timestamp with time zone DEFAULT now(),
  updateddt timestamp with time zone DEFAULT now(),
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