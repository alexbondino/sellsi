fetch("https://clbngnjetipglkikondm.supabase.co/rest/v1/product_images?select=product_id%2Cthumbnails%2Cthumbnail_url%2Cthumbnail_signature&product_id=eq.a9604229-1961-4d1b-98cf-3bcf2ad6fb24&image_order=eq.0", {
  "headers": {
    "accept": "application/vnd.pgrst.object+json",
    "accept-language": "es,es-ES;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6,es-CL;q=0.5,es-MX;q=0.4",
    "accept-profile": "public",
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsYm5nbmpldGlwZ2xraWtvbmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzczNzEsImV4cCI6MjA2ODI1MzM3MX0.4EpHtBMJ_Lh8O77sAPat-oVvOqYv89qm5wg5KMmfaFc",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6InpLR2tmZ0EzVi9LUEtkNnoiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2NsYm5nbmpldGlwZ2xraWtvbmRtLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyMGU3YTM0OC02NmI2LTQ4MjQtYjA1OS0yYzY3YzVlNmE0OWMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU3NDgzMTYxLCJpYXQiOjE3NTc0Nzk1NjEsImVtYWlsIjoia2xhdXNhbmRlcnNvbjk1QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJrbGF1c2FuZGVyc29uOTVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiMjBlN2EzNDgtNjZiNi00ODI0LWIwNTktMmM2N2M1ZTZhNDljIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTc0NjA0NjN9XSwic2Vzc2lvbl9pZCI6IjBkYzFhODhhLTFlNzEtNDliMi1hYjFmLWE3Nzc3MjdjMzNiYSIsImlzX2Fub255bW91cyI6ZmFsc2V9.dWi1abNfcp19nBrGPXN4dsEGZ0R8yGEyERvyoOJKVQk",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Microsoft Edge\";v=\"140\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "x-client-info": "supabase-js-web/2.50.0"
  },
  "referrer": "http://localhost:3000/",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
  {"product_id":"a9604229-1961-4d1b-98cf-3bcf2ad6fb24","thumbnails":{"mobile": "https://clbngnjetipglkikondm.supabase.co/storage/v1/object/public/product-images-thumbnails/e9029faf-6c7a-44b9-80f2-e33bbef06948/a9604229-1961-4d1b-98cf-3bcf2ad6fb24/1756257226004_mobile_190x153.jpg", "tablet": "https://clbngnjetipglkikondm.supabase.co/storage/v1/object/public/product-images-thumbnails/e9029faf-6c7a-44b9-80f2-e33bbef06948/a9604229-1961-4d1b-98cf-3bcf2ad6fb24/1756257226004_tablet_300x230.jpg", "desktop": "https://clbngnjetipglkikondm.supabase.co/storage/v1/object/public/product-images-thumbnails/e9029faf-6c7a-44b9-80f2-e33bbef06948/a9604229-1961-4d1b-98cf-3bcf2ad6fb24/1756257226004_desktop_320x260.jpg", "minithumb": "https://clbngnjetipglkikondm.supabase.co/storage/v1/object/public/product-images-thumbnails/e9029faf-6c7a-44b9-80f2-e33bbef06948/a9604229-1961-4d1b-98cf-3bcf2ad6fb24/1756257226004_minithumb_40x40.jpg"},"thumbnail_url":"https://clbngnjetipglkikondm.supabase.co/storage/v1/object/public/product-images-thumbnails/e9029faf-6c7a-44b9-80f2-e33bbef06948/a9604229-1961-4d1b-98cf-3bcf2ad6fb24/1756257226004_desktop_320x260.jpg","thumbnail_signature":"1756257222372.jpg"}
});



phase1ETAGThumbnailService.js:23 [FASE1_ETAG] Service initialized with TTL: 1800000
supabase.js:105 [auth:getUser] real fetch
scheduler.development.js:14 [Violation] 'message' handler took 613ms
supabase.js:96 [auth:getUser] cache hit
scheduler.development.js:14 [Violation] 'message' handler took 383ms
useProducts.js:225 [useProducts] fetchTiersBatch called (#1) ids=8 (8) ['a9604229-1961-4d1b-98cf-3bcf2ad6fb24', '351857c1-d526-4f75-a292-22d7bd624fd3', '5a05b070-dee3-4d17-938e-73ce5649c70f', 'afaff223-5d68-4dac-a272-194edb3f80ef', '67ec076a-b791-4a0d-a877-a22effd6b443', 'c93aba57-2b7a-4b3c-bb22-215bab7d1002', 'd7dbea72-e566-43f3-846f-4de72697732f', '38b6c9bb-e3d1-4f78-9360-51028d2a77c5']
cartStore.backend.js:69 [cartStore.backend] updatedItems after migrate: {cartId: '125d1517-55b9-4a5e-8ddb-118459281956', updatedItems: Array(3)}
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 827ms | Hit Ratio: 0.0% | Cache Size: 1
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 852ms | Hit Ratio: 0.0% | Cache Size: 2
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 853ms | Hit Ratio: 0.0% | Cache Size: 3
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 854ms | Hit Ratio: 0.0% | Cache Size: 4
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 854ms | Hit Ratio: 0.0% | Cache Size: 5
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 856ms | Hit Ratio: 0.0% | Cache Size: 6
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 876ms | Hit Ratio: 0.0% | Cache Size: 7
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 877ms | Hit Ratio: 0.0% | Cache Size: 8
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 880ms | Hit Ratio: 0.0% | Cache Size: 9
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 880ms | Hit Ratio: 0.0% | Cache Size: 10
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 884ms | Hit Ratio: 0.0% | Cache Size: 11
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 886ms | Hit Ratio: 0.0% | Cache Size: 12
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 940ms | Hit Ratio: 0.0% | Cache Size: 20
useProducts.js:262 [useProducts] fetchTiersBatch finished (#1) ids=8
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 117ms | Hit Ratio: 0.0% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 134ms | Hit Ratio: 0.0% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 141ms | Hit Ratio: 0.0% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 184ms | Hit Ratio: 0.0% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 189ms | Hit Ratio: 0.0% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 173ms | Hit Ratio: 0.0% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 176ms | Hit Ratio: 0.0% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 198ms | Hit Ratio: 0.0% | Cache Size: 20




SEGUNDO F5
phase1ETAGThumbnailService.js:23 [FASE1_ETAG] Service initialized with TTL: 1800000
cartStore.backend.js:55 [cartStore.backend] migrateLocalCart payload: {userId: '20e7a348-66b6-4824-b059-2c67c5e6a49c', localItems: Array(3)}
cartStore.backend.js:69 [cartStore.backend] updatedItems after migrate: {cartId: '125d1517-55b9-4a5e-8ddb-118459281956', updatedItems: Array(3)}
supabase.js:96 [auth:getUser] cache hit
useProducts.js:225 [useProducts] fetchTiersBatch called (#1) ids=12 (12) ['a9604229-1961-4d1b-98cf-3bcf2ad6fb24', '351857c1-d526-4f75-a292-22d7bd624fd3', '5a05b070-dee3-4d17-938e-73ce5649c70f', 'afaff223-5d68-4dac-a272-194edb3f80ef', '67ec076a-b791-4a0d-a877-a22effd6b443', 'c93aba57-2b7a-4b3c-bb22-215bab7d1002', 'd7dbea72-e566-43f3-846f-4de72697732f', '38b6c9bb-e3d1-4f78-9360-51028d2a77c5', 'e6d1201e-57d6-44f3-901b-835701615e89', '3f7bfdad-cfeb-4619-a715-2d23b706e21d', '22ccd7b9-a315-4e2a-9f50-a19a30299042', 'cda6fc70-c8b8-42f7-8815-29a5d45bc0fa']
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 1029ms | Hit Ratio: 0.0% | Cache Size: 1
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 1029ms | Hit Ratio: 0.0% | Cache Size: 2
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 1042ms | Hit Ratio: 0.0% | Cache Size: 3
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 1045ms | Hit Ratio: 0.0% | Cache Size: 4
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 1046ms | Hit Ratio: 0.0% | Cache Size: 5
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 1047ms | Hit Ratio: 0.0% | Cache Size: 6
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 1079ms | Hit Ratio: 0.0% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 1059ms | Hit Ratio: 0.0% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_hit: 0ms | Hit Ratio: 11.1% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_hit: 0ms | Hit Ratio: 20.0% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 1083ms | Hit Ratio: 18.2% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 1083ms | Hit Ratio: 16.7% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 1084ms | Hit Ratio: 15.4% | Cache Size: 20
useProducts.js:262 [useProducts] fetchTiersBatch finished (#1) ids=12
react-dom-client.development.js:16244 [Violation] 'setTimeout' handler took 369ms
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 1466ms | Hit Ratio: 14.3% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 1467ms | Hit Ratio: 13.3% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 508ms | Hit Ratio: 12.5% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 508ms | Hit Ratio: 11.8% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 527ms | Hit Ratio: 11.1% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 594ms | Hit Ratio: 10.5% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 598ms | Hit Ratio: 10.0% | Cache Size: 20
phase1ETAGThumbnailService.js:151 [FASE1_ETAG] cache_miss: 637ms | Hit Ratio: 9.5% | Cache Size: 20
