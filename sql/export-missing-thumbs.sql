-- export-missing-thumbs.sql
-- Exports product_id, image_url, supplier_id, thumb_url for products that have thumbnail metadata but no thumbnail objects in storage
COPY (
  WITH main AS (
    SELECT
      pi.product_id,
      pi.id AS product_image_id,
      pi.image_url,
      p.supplier_id,
      COALESCE(pi.thumbnail_url, pi.thumbnails->>'desktop') AS thumb_url,
      regexp_replace(COALESCE(pi.thumbnail_url, pi.thumbnails->>'desktop'), '.*/', '') AS filename
    FROM public.product_images pi
    JOIN public.products p ON p.productid = pi.product_id
    WHERE pi.image_order = 0
      AND (pi.thumbnail_url IS NOT NULL OR pi.thumbnails IS NOT NULL)
  )
  SELECT
    m.product_id,
    m.image_url,
    m.supplier_id,
    m.thumb_url
  FROM main m
  LEFT JOIN storage.objects o ON o.name ILIKE '%' || m.filename || '%'
  WHERE o.id IS NULL
  ORDER BY m.product_id
) TO STDOUT WITH CSV HEADER;
