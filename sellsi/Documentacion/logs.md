khipuService.js:64   POST https://clbngnjetipglkikondm.supabase.co/functions/v1/create-payment-khipu 409 (Conflict)
(anonymous) @ fetch.ts:15
(anonymous) @ fetch.ts:46
fulfilled @ fetch.ts:2
Promise.then
step @ fetch.ts:2
(anonymous) @ fetch.ts:2
__awaiter6 @ fetch.ts:2
(anonymous) @ fetch.ts:34
(anonymous) @ helper.ts:13
(anonymous) @ FunctionsClient.ts:91
(anonymous) @ types.ts:44
__awaiter @ types.ts:44
invoke @ FunctionsClient.ts:51
createPaymentOrder @ khipuService.js:64
processKhipuPayment @ checkoutService.js:171
handleContinue @ PaymentMethodSelector.jsx:215
await in handleContinue
handleContinue @ CheckoutSummary.jsx:123
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
khipuService.js:73  [khipuService] Error bruto supabase.functions.invoke: FunctionsHttpError: Edge Function returned a non-2xx status code
    at FunctionsClient.<anonymous> (FunctionsClient.ts:109:15)
    at Generator.next (<anonymous>)
    at fulfilled (types.ts:44:27)
overrideMethod @ hook.js:608
createPaymentOrder @ khipuService.js:73
await in createPaymentOrder
processKhipuPayment @ checkoutService.js:171
handleContinue @ PaymentMethodSelector.jsx:215
await in handleContinue
handleContinue @ CheckoutSummary.jsx:123
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
khipuService.js:97  Error en khipuService.createPaymentOrder: Error: Error al invocar la función de Supabase: Edge Function returned a non-2xx status code
    at KhipuService.createPaymentOrder (khipuService.js:74:15)
    at async CheckoutService.processKhipuPayment (checkoutService.js:171:29)
    at async handleContinue (PaymentMethodSelector.jsx:215:31)
overrideMethod @ hook.js:608
createPaymentOrder @ khipuService.js:97
await in createPaymentOrder
processKhipuPayment @ checkoutService.js:171
handleContinue @ PaymentMethodSelector.jsx:215
await in handleContinue
handleContinue @ CheckoutSummary.jsx:123
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
checkoutService.js:243  Error processing Khipu payment: Error: Error al invocar la función de Supabase: Edge Function returned a non-2xx status code
    at KhipuService.createPaymentOrder (khipuService.js:74:15)
    at async CheckoutService.processKhipuPayment (checkoutService.js:171:29)
    at async handleContinue (PaymentMethodSelector.jsx:215:31)
overrideMethod @ hook.js:608
processKhipuPayment @ checkoutService.js:243
await in processKhipuPayment
handleContinue @ PaymentMethodSelector.jsx:215
await in handleContinue
handleContinue @ CheckoutSummary.jsx:123
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
PaymentMethodSelector.jsx:243  Error processing payment: Error: Error en el pago: Error al invocar la función de Supabase: Edge Function returned a non-2xx status code
    at CheckoutService.processKhipuPayment (checkoutService.js:244:13)
    at async handleContinue (PaymentMethodSelector.jsx:215:31)
overrideMethod @ hook.js:608
handleContinue @ PaymentMethodSelector.jsx:243
await in handleContinue
handleContinue @ CheckoutSummary.jsx:123
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
