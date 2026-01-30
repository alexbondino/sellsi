fetch.ts:15   GET https://clbngnjetipglkikondm.supabase.co/rest/v1/control_panel_users?select=*&usuario=eq.admin&is_active=eq.true 406 (Not Acceptable)
(anonymous) @ fetch.ts:15
(anonymous) @ fetch.ts:46
fulfilled @ fetch.ts:2
Promise.then
step @ fetch.ts:2
(anonymous) @ fetch.ts:2
__awaiter8 @ fetch.ts:2
(anonymous) @ fetch.ts:34
then @ PostgrestBuilder.ts:115


fetch("https://clbngnjetipglkikondm.supabase.co/rest/v1/control_panel_users?select=*&usuario=eq.admin&is_active=eq.true", {
  "headers": {
    "accept": "application/vnd.pgrst.object+json",
    "accept-language": "es,es-ES;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6,es-CL;q=0.5,es-MX;q=0.4",
    "accept-profile": "public",
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsYm5nbmpldGlwZ2xraWtvbmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzczNzEsImV4cCI6MjA2ODI1MzM3MX0.4EpHtBMJ_Lh8O77sAPat-oVvOqYv89qm5wg5KMmfaFc",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6InpLR2tmZ0EzVi9LUEtkNnoiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2NsYm5nbmpldGlwZ2xraWtvbmRtLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI4MzdhM2IyMi05NTNjLTRiZTUtOWE1Mi03ZTI2NDBhNjk2NGQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY5NDM1NzUzLCJpYXQiOjE3Njk0MzIxNTMsImVtYWlsIjoiYWRtaW5Ac2VsbHNpLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWV9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzY5MTg1NjgxfV0sInNlc3Npb25faWQiOiIwYjY2NGJhNi1hODdiLTQ0YzMtYjZiOC1iMGExOWIzNjI3YzYiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.FU0YecebRf21_tdqoMC2x9UNmRN2HHEk0778kbJnVhU",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"144\", \"Microsoft Edge\";v=\"144\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "x-client-info": "supabase-js-web/2.58.0"
  },
  "referrer": "http://localhost:5174/",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});

{"code":"PGRST116","details":"The result contains 0 rows","hint":null,"message":"JSON object requested, multiple (or no) rows returned"}FinanciamientosTable.jsx:266  Uncaught ReferenceError: useBodyScrollLock is not defined
    at FinanciamientosTable (FinanciamientosTable.jsx:266:3)
    at Object.react_stack_bottom_frame (react-dom_client.js?v=aeb90140:17424:20)
    at renderWithHooks (react-dom_client.js?v=aeb90140:4206:24)
    at updateFunctionComponent (react-dom_client.js?v=aeb90140:6619:21)
    at beginWork (react-dom_client.js?v=aeb90140:7654:20)
    at runWithFiberInDEV (react-dom_client.js?v=aeb90140:1485:72)
    at performUnitOfWork (react-dom_client.js?v=aeb90140:10868:98)
    at workLoopSync (react-dom_client.js?v=aeb90140:10728:43)
    at renderRootSync (react-dom_client.js?v=aeb90140:10711:13)
    at performWorkOnRoot (react-dom_client.js?v=aeb90140:10359:46)
