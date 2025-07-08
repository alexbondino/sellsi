user-logos
Public

DELETE
Allow authenticated delete to user-logos 87qw12_0
((bucket_id = 'user-logos'::text) AND (auth.uid() = owner))


UPDATE
Allow authenticated update to user-logos 87qw12_0
((bucket_id = 'user-logos'::text) AND (owner = auth.uid()))

INSERT
Allow authenticated upload to user-logos
((bucket_id = 'user-logos'::text) AND (auth.uid() = owner))

SELECT
Allow public read access to user-logos
(bucket_id = 'user-logos'::text)