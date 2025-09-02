 sellsi@0.0.0 test:unit
> jest --testPathPatterns="unit" --coverage --coverageDirectory=coverage/unit

 PASS  src/__tests__/unit/basic.test.js (5.311 s)                                                                                                                
  Test Configuration
    √ should run basic test (14 ms)
    √ should have access to DOM (5 ms)                                                                                                                           
                                                                                                                                                                 
 FAIL  src/__tests__/unit/notificationService.test.js                                                                                                            
  ● Test suite failed to run
                                                                                                                                                                 
    TypeError: Cannot read properties of undefined (reading 'mockSupabase')                                                                                      
                                                                                                                                                                 
       8 | // Mock de Supabase                                                                                                                                   
       9 | jest.mock('../../services/supabase', () => ({                                                                                                         
    > 10 |   supabase: mockSupabase                                                                                                                              
         |             ^                                                                                                                                         
      11 | }));                                                                                                                                                  
      12 |                                                                                                                                                       
      13 | describe('notificationService', () => {                                                                                                               

      at mockSupabase (src/__tests__/unit/notificationService.test.js:10:13)
      at Object.require (src/domains/notifications/services/notificationService.js:2:1)
      at Object.require (src/__tests__/unit/notificationService.test.js:1:1)

 FAIL  src/__tests__/unit/edgeCases.test.js
  ● Test suite failed to run
                                                                                                                                                                 
    TypeError: Cannot read properties of undefined (reading 'mockSupabase')                                                                                      
                                                                                                                                                                 
       5 | // Mock de Supabase                                                                                                                                   
       6 | jest.mock('../../services/supabase', () => ({                                                                                                         
    >  7 |   supabase: mockSupabase                                                                                                                              
         |             ^                                                                                                                                         
       8 | }));                                                                                                                                                  
       9 |                                                                                                                                                       
      10 | describe('Offer System Edge Cases', () => {                                                                                                           

      at mockSupabase (src/__tests__/unit/edgeCases.test.js:7:13)
      at Object.require (src/stores/offerStore.js:2:1)
      at Object.require (src/__tests__/unit/edgeCases.test.js:2:1)

 FAIL  src/__tests__/unit/offerStore.test.js
  ● Test suite failed to run
                                                                                                                                                                 
    TypeError: Cannot read properties of undefined (reading 'mockSupabase')                                                                                      
                                                                                                                                                                 
       5 | // Mock de Supabase                                                                                                                                   
       6 | jest.mock('../../services/supabase', () => ({                                                                                                         
    >  7 |   supabase: mockSupabase                                                                                                                              
         |             ^                                                                                                                                         
       8 | }));                                                                                                                                                  
       9 |                                                                                                                                                       
      10 | // Mock del servicio de notificaciones                                                                                                                

      at mockSupabase (src/__tests__/unit/offerStore.test.js:7:13)
      at Object.require (src/stores/offerStore.js:2:1)
      at Object.require (src/__tests__/unit/offerStore.test.js:2:1)

  console.error
    Error parsing user from localStorage: SyntaxError: Unexpected token 'i', "invalid_json" is not valid JSON
        at JSON.parse (<anonymous>)
        at parse (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\buyer\pages\offers\hooks\useBuyerOffers.js:19:27)
        at Object.react-stack-bottom-frame (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\react-dom\cjs\react-dom-client.development.js:23949:20)
        at runWithFiberInDEV (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\react-dom\cjs\react-dom-client.development.js:1522:13)
        at commitHookEffectListMount (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\react-dom\cjs\react-dom-client.development.js:11905:29)
        at commitHookPassiveMountEffects (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\react-dom\cjs\react-dom-client.development.js:12028:11)
        at commitPassiveMountOnFiber (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\react-dom\cjs\react-dom-client.development.js:13841:13)      
        at recursivelyTraversePassiveMountEffects (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\react-dom\cjs\react-dom-client.development.js:13815:11)                                                                                                                                                          
        at commitPassiveMountOnFiber (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\react-dom\cjs\react-dom-client.development.js:13853:11)
        at flushPassiveEffects (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\react-dom\cjs\react-dom-client.development.js:15737:9)
        at C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\react-dom\cjs\react-dom-client.development.js:15379:15
        at flushActQueue (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\react\cjs\react.development.js:566:34)
        at process.env.NODE_ENV.exports.act (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\react\cjs\react.development.js:859:10)
        at actImplementation (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\@testing-library\react\dist\act-compat.js:47:25)
        at renderRoot (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\@testing-library\react\dist\pure.js:190:25)
        at renderRoot (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\@testing-library\react\dist\pure.js:292:10)
        at render (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\@testing-library\react\dist\pure.js:340:7)
        at Object.<anonymous> (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\__tests__\unit\offerHooks.test.js:48:17)
        at Promise.finally.completed (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\jest-circus\build\jestAdapterInit.js:1556:28)
        at new Promise (<anonymous>)
        at callAsyncCircusFn (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\jest-circus\build\jestAdapterInit.js:1496:10)
        at _callCircusTest (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\jest-circus\build\jestAdapterInit.js:1006:40)
        at _runTest (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\jest-circus\build\jestAdapterInit.js:946:3)
        at _runTestsForDescribeBlock (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\jest-circus\build\jestAdapterInit.js:839:13)
        at _runTestsForDescribeBlock (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\jest-circus\build\jestAdapterInit.js:829:11)
        at _runTestsForDescribeBlock (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\jest-circus\build\jestAdapterInit.js:829:11)
        at run (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\jest-circus\build\jestAdapterInit.js:757:3)
        at runAndTransformResultsToJestFormat (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\jest-circus\build\jestAdapterInit.js:1917:21)       
        at jestAdapter (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\jest-circus\build\runner.js:101:19)
        at runTestInternal (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\jest-runner\build\testWorker.js:275:16)
        at runTest (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\jest-runner\build\testWorker.js:343:7)
        at Object.worker (C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\node_modules\jest-runner\build\testWorker.js:497:12)

      31 |       return;
      32 |     }
    > 33 |     originalError.call(console, ...args);
         |                   ^
      34 |   };
      35 | });
      36 |

      at console.call [as error] (src/__tests__/setup.js:33:19)
      at error (src/domains/buyer/pages/offers/hooks/useBuyerOffers.js:24:17)
      at Object.react-stack-bottom-frame (node_modules/react-dom/cjs/react-dom-client.development.js:23949:20)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at commitHookEffectListMount (node_modules/react-dom/cjs/react-dom-client.development.js:11905:29)
      at commitHookPassiveMountEffects (node_modules/react-dom/cjs/react-dom-client.development.js:12028:11)
      at commitPassiveMountOnFiber (node_modules/react-dom/cjs/react-dom-client.development.js:13841:13)
      at recursivelyTraversePassiveMountEffects (node_modules/react-dom/cjs/react-dom-client.development.js:13815:11)
      at commitPassiveMountOnFiber (node_modules/react-dom/cjs/react-dom-client.development.js:13853:11)
      at flushPassiveEffects (node_modules/react-dom/cjs/react-dom-client.development.js:15737:9)
      at node_modules/react-dom/cjs/react-dom-client.development.js:15379:15
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:859:10)
      at actImplementation (node_modules/@testing-library/react/dist/act-compat.js:47:25)
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:25)
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:292:10)
      at render (node_modules/@testing-library/react/dist/pure.js:340:7)
      at Object.<anonymous> (src/__tests__/unit/offerHooks.test.js:48:17)

 PASS  src/__tests__/unit/offerHooks.test.js (5.712 s)
  Offer Hooks
    useBuyerOffers                                                                                                                                               
      √ debería obtener ofertas del comprador al montar (74 ms)                                                                                                  
      √ debería manejar usuario inválido en localStorage (171 ms)
      √ debería manejar localStorage vacío (8 ms)                                                                                                                
      √ debería proporcionar funciones de acción (9 ms)                                                                                                          
      √ debería manejar ofertas nulas como array vacío (5 ms)                                                                                                    
    useSupplierOffers                                                                                                                                            
      √ debería obtener ofertas del proveedor al montar (27 ms)                                                                                                  
      √ debería sincronizar estado local con el store (29 ms)                                                                                                    
      √ debería proporcionar setOffers para manipulación local (5 ms)                                                                                            
      √ debería proporcionar funciones de acción del store (4 ms)                                                                                                
      √ debería manejar error al parsear usuario desde localStorage (7 ms)                                                                                       
      √ debería manejar usuario sin ID (2 ms)                                                                                                                    
    Hook Dependencies                                                                                                                                            
      √ useBuyerOffers debería re-ejecutar fetch cuando cambia fetchBuyerOffers (2 ms)                                                                           
      √ useSupplierOffers debería re-ejecutar fetch cuando cambia fetchSupplierOffers (4 ms)                                                                     
                                                                                                                                                                 
                                                                                                                                                                 
 RUNS  src/__tests__/unit/buyerOffersComponents.test.js

Test Suites: 3 failed, 2 passed, 5 of 6 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        146 s