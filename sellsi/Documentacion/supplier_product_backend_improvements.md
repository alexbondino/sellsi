# Backend Improvement Proposals for Supplier Product Management

## 1. Product Document (PDF/Manual) Support

**Proposal:**
- Add a `product_documents` table to support uploading and linking PDF manuals or datasheets to products.
- This enables suppliers to provide technical documentation, user manuals, or compliance certificates for each product.

**Optional SQL Example:**
```sql
CREATE TABLE public.product_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(productid),
  document_url text NOT NULL,
  document_type text, -- e.g., 'manual', 'datasheet', 'certificate'
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_documents_pkey PRIMARY KEY (id)
);
```

**Frontend/Backend Integration:**
- Use Supabase Storage for PDF uploads (already supported by `uploadService.js`).
- Store the public URL and metadata in `product_documents`.

---

## 2. Category Referential Integrity

**Current:**
- Product categories are free text in the `products` table, but the frontend uses a fixed select, preventing typos.

**Optional Improvement:**
- Add a `categories` table and use a foreign key in `products` for referential integrity.
- This prevents future issues if categories become dynamic or editable by admins.

**Optional SQL Example:**
```sql
CREATE TABLE public.categories (
  id serial PRIMARY KEY,
  name varchar(64) UNIQUE NOT NULL
);
ALTER TABLE public.products
  ADD CONSTRAINT products_category_fkey FOREIGN KEY (category) REFERENCES public.categories(name);
```

**Migration:**
- Populate `categories` with current fixed values.
- Update frontend to fetch categories from the backend if dynamic categories are needed.

---

## 3. Product Image Management

**Current:**
- The `product_images` table supports multiple images per product and a primary image flag (`is_primary`).

**Best Practice:**
- Always set one image as primary for each product.
- Clean up orphaned images when a product is deleted.

---

## 4. General Recommendations

- **Minimal Schema Changes:** Only add new tables or logic if the business need arises (e.g., PDF/manual support, dynamic categories).
- **Future-Proofing:** The current schema is robust and ready for production, but these improvements can be implemented incrementally as requirements evolve.

---

## Summary Table

| Proposal                | Status      | Action Needed? |
|-------------------------|-------------|----------------|
| Product PDFs/Documents  | Optional    | Add table if needed |
| Category Integrity      | Optional    | Add table if categories become dynamic |
| Image Management        | Supported   | Enforce primary image, clean up on delete |

---

*Document generated on 2025-06-12. For questions, contact the backend team.*
