BOTTOMBAR.JSX

TERMINOS Y CONDICIONES
react-dom-client.development.js:5584  Uncaught Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.
    at finishRenderingHooks (react-dom-client.development.js:5584:15)
    at renderWithHooks (react-dom-client.development.js:5551:7)
    at updateFunctionComponent (react-dom-client.development.js:8897:19)
    at beginWork (react-dom-client.development.js:10522:18)
    at runWithFiberInDEV (react-dom-client.development.js:1519:30)
    at performUnitOfWork (react-dom-client.development.js:15132:22)
    at workLoopSync (react-dom-client.development.js:14956:41)
    at renderRootSync (react-dom-client.development.js:14936:11)
    at performWorkOnRoot (react-dom-client.development.js:14462:44)
    at performWorkOnRootViaSchedulerTask (react-dom-client.development.js:16216:7)
finishRenderingHooks @ react-dom-client.development.js:5584
renderWithHooks @ react-dom-client.development.js:5551
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14462
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45

POLITICA Y PRIVACIDAD
react-dom-client.development.js:5584  Uncaught Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.
    at finishRenderingHooks (react-dom-client.development.js:5584:15)
    at renderWithHooks (react-dom-client.development.js:5551:7)
    at updateFunctionComponent (react-dom-client.development.js:8897:19)
    at beginWork (react-dom-client.development.js:10522:18)
    at runWithFiberInDEV (react-dom-client.development.js:1519:30)
    at performUnitOfWork (react-dom-client.development.js:15132:22)
    at workLoopSync (react-dom-client.development.js:14956:41)
    at renderRootSync (react-dom-client.development.js:14936:11)
    at performWorkOnRoot (react-dom-client.development.js:14462:44)
    at performWorkOnRootViaSchedulerTask (react-dom-client.development.js:16216:7)
finishRenderingHooks @ react-dom-client.development.js:5584
renderWithHooks @ react-dom-client.development.js:5551
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14462
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45


TOPBAR.JSX
Banner.jsx:17  React has detected a change in the order of Hooks called by Banner. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://react.dev/link/rules-of-hooks

   Previous render            Next render
   ------------------------------------------------------
1. useContext                 useContext
2. useContext                 useContext
3. useContext                 useContext
4. useState                   useState
5. undefined                  useEffect
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

overrideMethod @ hook.js:608
updateHookTypesDev @ react-dom-client.development.js:5436
useEffect @ react-dom-client.development.js:23158
exports.useEffect @ react.development.js:1186
Banner @ Banner.jsx:17
react-stack-bottom-frame @ react-dom-client.development.js:23863
renderWithHooks @ react-dom-client.development.js:5529
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopConcurrentByScheduler @ react-dom-client.development.js:15126
renderRootConcurrent @ react-dom-client.development.js:15101
performWorkOnRoot @ react-dom-client.development.js:14418
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
react-dom-client.development.js:5715  Uncaught Error: Rendered more hooks than during the previous render.
    at updateWorkInProgressHook (react-dom-client.development.js:5715:17)
    at updateEffectImpl (react-dom-client.development.js:6504:18)
    at Object.useEffect (react-dom-client.development.js:23159:9)
    at exports.useEffect (react.development.js:1186:25)
    at Banner (Banner.jsx:17:3)
    at react-stack-bottom-frame (react-dom-client.development.js:23863:20)
    at renderWithHooks (react-dom-client.development.js:5529:22)
    at updateFunctionComponent (react-dom-client.development.js:8897:19)
    at beginWork (react-dom-client.development.js:10522:18)
    at runWithFiberInDEV (react-dom-client.development.js:1519:30)
updateWorkInProgressHook @ react-dom-client.development.js:5715
updateEffectImpl @ react-dom-client.development.js:6504
useEffect @ react-dom-client.development.js:23159
exports.useEffect @ react.development.js:1186
Banner @ Banner.jsx:17
react-stack-bottom-frame @ react-dom-client.development.js:23863
renderWithHooks @ react-dom-client.development.js:5529
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14462
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
