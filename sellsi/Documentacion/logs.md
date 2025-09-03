fetch.ts:15   POST https://clbngnjetipglkikondm.supabase.co/rest/v1/rpc/create_notification 404 (Not Found)
(anonymous) @ fetch.ts:15
(anonymous) @ fetch.ts:46
fulfilled @ fetch.ts:2
Promise.then
step @ fetch.ts:2
(anonymous) @ fetch.ts:2
__awaiter6 @ fetch.ts:2
(anonymous) @ fetch.ts:34
then @ PostgrestBuilder.ts:101
notificationService.js:153  [NotificationService] ERROR creating offer notification: {code: 'PGRST202', details: 'Searched for the function public.create_notificati…r, but no matches were found in the schema cache.', hint: 'Perhaps you meant to call the function public.crea…ntext, p_supplier_id, p_title, p_type, p_user_id)', message: 'Could not find the function public.create_notifica…, p_title, p_type, p_user_id) in the schema cache'}
overrideMethod @ hook.js:608
notifyOfferReceived @ notificationService.js:153
await in notifyOfferReceived
createOffer @ offerStore.js:118
await in createOffer
handleSubmit @ OfferModal.jsx:178
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
fetch.ts:15   POST https://clbngnjetipglkikondm.supabase.co/rest/v1/rpc/create_notification 404 (Not Found)
(anonymous) @ fetch.ts:15
(anonymous) @ fetch.ts:46
fulfilled @ fetch.ts:2
Promise.then
step @ fetch.ts:2
(anonymous) @ fetch.ts:2
__awaiter6 @ fetch.ts:2
(anonymous) @ fetch.ts:34
then @ PostgrestBuilder.ts:101
