prefetch.js:36  Uncaught TypeError: Cannot read properties of undefined (reading 'catch')
    at prefetch.js:36:17
(anonymous) @ prefetch.js:36
requestIdleCallback
idle @ prefetch.js:9
prefetch @ prefetch.js:34
(anonymous) @ prefetch.js:78
setTimeout
onMouseEnter @ prefetch.js:78
onMouseEnter @ SideBar.jsx:331
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchContinuousEvent @ react-dom-client.development.js:20643


MyOrdersPage.jsx:623 
 ReferenceError: Cannot access 'authResolved' before initialization
    at MyOrdersPage (MyOrdersPage.jsx:75:7)


The above error occurred in the <MyOrdersPage> component.

React will try to recreate this component tree from scratch using the error boundary you provided, SupplierErrorBoundary.