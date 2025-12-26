fetch("https://kaxjvxfddrfoixxmxgfc.supabase.co/rest/v1/admin_audit_log?columns=%22admin_id%22%2C%22action%22%2C%22target_id%22%2C%22details%22%2C%22timestamp%22", {
  "headers": {
    "accept": "*/*",
    "accept-language": "es,es-ES;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6,es-CL;q=0.5,es-MX;q=0.4",
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtheGp2eGZkZHJmb2l4eG14Z2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTcxODIsImV4cCI6MjA3ODc3MzE4Mn0.up0puyEuU2TjJXeiPCQ3Mj-GJ2UA_sc-8aeM4IeygOI",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtheGp2eGZkZHJmb2l4eG14Z2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTcxODIsImV4cCI6MjA3ODc3MzE4Mn0.up0puyEuU2TjJXeiPCQ3Mj-GJ2UA_sc-8aeM4IeygOI",
    "content-profile": "public",
    "content-type": "application/json",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Microsoft Edge\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "x-client-info": "supabase-js-web/2.58.0"
  },
  "referrer": "http://localhost:5174/",
  "body": "[{\"admin_id\":\"50cdfeff-0793-44dc-9b8f-9d61f10d4b66\",\"action\":\"login\",\"target_id\":\"50cdfeff-0793-44dc-9b8f-9d61f10d4b66\",\"details\":{\"usuario\":\"adminsellsi\",\"login_time\":\"2025-12-26T15:44:07.321Z\"},\"timestamp\":\"2025-12-26T15:44:07.321Z\"}]",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});

{"code":"42501","details":null,"hint":null,"message":"new row violates row-level security policy for table \"admin_audit_log\""}


fetch("https://kaxjvxfddrfoixxmxgfc.supabase.co/functions/v1/admin-2fa", {
  "headers": {
    "admin-email": "admin@sellsi.com",
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtheGp2eGZkZHJmb2l4eG14Z2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTcxODIsImV4cCI6MjA3ODc3MzE4Mn0.up0puyEuU2TjJXeiPCQ3Mj-GJ2UA_sc-8aeM4IeygOI",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtheGp2eGZkZHJmb2l4eG14Z2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTcxODIsImV4cCI6MjA3ODc3MzE4Mn0.up0puyEuU2TjJXeiPCQ3Mj-GJ2UA_sc-8aeM4IeygOI",
    "content-type": "application/json",
    "sec-ch-ua": "\"Microsoft Edge\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "x-client-info": "supabase-js-web/2.58.0"
  },
  "referrer": "http://localhost:5174/",
  "body": "{\"action\":\"generate_secret\",\"adminId\":\"50cdfeff-0793-44dc-9b8f-9d61f10d4b66\",\"password\":\"Se115si9@K\"}",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});

fetch.ts:15   POST https://kaxjvxfddrfoixxmxgfc.supabase.co/rest/v1/admin_audit_log?columns=%22admin_id%22%2C%22action%22%2C%22target_id%22%2C%22details%22%2C%22timestamp%22 401 (Unauthorized)
(anonymous) @ fetch.ts:15
(anonymous) @ fetch.ts:46
fulfilled @ fetch.ts:2
Promise.then
step @ fetch.ts:2
(anonymous) @ fetch.ts:2
__awaiter8 @ fetch.ts:2
(anonymous) @ fetch.ts:34
then @ PostgrestBuilder.ts:115
login:1  Access to fetch at 'https://kaxjvxfddrfoixxmxgfc.supabase.co/functions/v1/admin-2fa' from origin 'http://localhost:5174' has been blocked by CORS policy: Request header field admin-email is not allowed by Access-Control-Allow-Headers in preflight response.
adminAuthService.js:189   POST https://kaxjvxfddrfoixxmxgfc.supabase.co/functions/v1/admin-2fa net::ERR_FAILED
(anonymous) @ fetch.ts:15
(anonymous) @ fetch.ts:46
fulfilled @ fetch.ts:2
Promise.then
step @ fetch.ts:2
(anonymous) @ fetch.ts:2
__awaiter8 @ fetch.ts:2
(anonymous) @ fetch.ts:34
(anonymous) @ helper.ts:13
(anonymous) @ FunctionsClient.ts:94
(anonymous) @ types.ts:45
__awaiter @ types.ts:45
invoke @ FunctionsClient.ts:51
(anonymous) @ adminAuthService.js:189
executeQuery @ adminApiService.js:22
generate2FASecret @ adminAuthService.js:183
handleGenerateSecret @ AdminLogin.jsx:453
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
<button>
exports.createElement @ react.development.js:1034
(anonymous) @ emotion-styled-base.browser.development.esm.js:156
MuiButtonBase-root @ emotion-element-489459f2.browser.development.esm.js:34
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateForwardRef @ react-dom-client.development.js:8645
beginWork @ react-dom-client.development.js:10861
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
<MuiButtonBaseRoot>
exports.jsxs @ react-jsx-runtime.development.js:355
ButtonBase2 @ ButtonBase.js:248
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateForwardRef @ react-dom-client.development.js:8645
beginWork @ react-dom-client.development.js:10861
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
<ForwardRef(ButtonBase2)>
exports.createElement @ react.development.js:1034
(anonymous) @ emotion-styled-base.browser.development.esm.js:156
MuiButton-root @ emotion-element-489459f2.browser.development.esm.js:34
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateForwardRef @ react-dom-client.development.js:8645
beginWork @ react-dom-client.development.js:10861
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
<MuiButtonRoot>
exports.jsxs @ react-jsx-runtime.development.js:355
Button2 @ Button.js:554
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateForwardRef @ react-dom-client.development.js:8645
beginWork @ react-dom-client.development.js:10861
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
<ForwardRef(Button2)>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:346
PrimaryButton @ PrimaryButton.jsx:61
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
<PrimaryButton>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:346
renderSetup2FAStep @ AdminLogin.jsx:528
renderCurrentStep @ AdminLogin.jsx:602
AdminLogin @ AdminLogin.jsx:632
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
adminAuthService.js:201  Error en generate2FASecret: FunctionsFetchError: Failed to send a request to the Edge Function
    at FunctionsClient.ts:107:15
overrideMethod @ hook.js:608
(anonymous) @ adminAuthService.js:201
await in (anonymous)
executeQuery @ adminApiService.js:22
generate2FASecret @ adminAuthService.js:183
handleGenerateSecret @ AdminLogin.jsx:453
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
<button>
exports.createElement @ react.development.js:1034
(anonymous) @ emotion-styled-base.browser.development.esm.js:156
MuiButtonBase-root @ emotion-element-489459f2.browser.development.esm.js:34
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateForwardRef @ react-dom-client.development.js:8645
beginWork @ react-dom-client.development.js:10861
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
<MuiButtonBaseRoot>
exports.jsxs @ react-jsx-runtime.development.js:355
ButtonBase2 @ ButtonBase.js:248
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateForwardRef @ react-dom-client.development.js:8645
beginWork @ react-dom-client.development.js:10861
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
<ForwardRef(ButtonBase2)>
exports.createElement @ react.development.js:1034
(anonymous) @ emotion-styled-base.browser.development.esm.js:156
MuiButton-root @ emotion-element-489459f2.browser.development.esm.js:34
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateForwardRef @ react-dom-client.development.js:8645
beginWork @ react-dom-client.development.js:10861
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
<MuiButtonRoot>
exports.jsxs @ react-jsx-runtime.development.js:355
Button2 @ Button.js:554
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateForwardRef @ react-dom-client.development.js:8645
beginWork @ react-dom-client.development.js:10861
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
<ForwardRef(Button2)>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:346
PrimaryButton @ PrimaryButton.jsx:61
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
<PrimaryButton>