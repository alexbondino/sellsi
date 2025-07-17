requests.js:1   GET https://pvtmkfckdaeiqrfjskrq.supabase.co/rest/v1/control_panel_users?select=email&email=eq.klaus_neto%40hotmail.com 406 (Not Acceptable)
(anonymous) @ requests.js:1
(anonymous) @ fetch.ts:15
(anonymous) @ fetch.ts:46
fulfilled @ fetch.ts:2
Promise.then
step @ fetch.ts:2
(anonymous) @ fetch.ts:2
__awaiter6 @ fetch.ts:2
(anonymous) @ fetch.ts:34
then @ PostgrestBuilder.ts:101
requests.js:1   POST https://pvtmkfckdaeiqrfjskrq.supabase.co/rest/v1/control_panel_users?columns=%22email%22%2C%22password%22%2C%22full_name%22%2C%22role%22%2C%22created_by%22%2C%22is_active%22&select=* 400 (Bad Request)
(anonymous) @ requests.js:1
(anonymous) @ fetch.ts:15
(anonymous) @ fetch.ts:46
fulfilled @ fetch.ts:2
Promise.then
step @ fetch.ts:2
(anonymous) @ fetch.ts:2
__awaiter6 @ fetch.ts:2
(anonymous) @ fetch.ts:34
then @ PostgrestBuilder.ts:101
adminPanelService.js:1295  Error creando admin: {code: 'PGRST204', details: null, hint: null, message: "Could not find the 'password' column of 'control_panel_users' in the schema cache"}code: "PGRST204"details: nullhint: nullmessage: "Could not find the 'password' column of 'control_panel_users' in the schema cache"[[Prototype]]: Object
overrideMethod @ hook.js:608
createAdminAccount @ adminPanelService.js:1295
await in createAdminAccount
handleSubmit @ AdminAccountCreator.jsx:289
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
