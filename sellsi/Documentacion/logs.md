Frontend:
❌ Error al procesar la acción: Faltan vars: VITE_SUPABASE_FUNCTIONS_URL o VITE_SUPABASE_EDGE_URL


Consola:
MyOrdersPage.jsx:263 Error al procesar acción del modal: Error: Faltan vars: VITE_SUPABASE_FUNCTIONS_URL o VITE_SUPABASE_EDGE_URL
    at OrderService.updateSupplierPartStatus (orderService.js:179:25)
    at useSupplierPartActions.js:17:38
    at Object.accept (useSupplierPartActions.js:30:23)
    at handleModalSubmit (MyOrdersPage.jsx:189:29)
    at handleSubmitInternal (Modal.jsx:71:7)
    at executeDispatch (react-dom_client.js?v=8bd2fca2:11736:11)
    at runWithFiberInDEV (react-dom_client.js?v=8bd2fca2:1485:72)
    at processDispatchQueue (react-dom_client.js?v=8bd2fca2:11772:37)
    at react-dom_client.js?v=8bd2fca2:12182:11
    at batchedUpdates$1 (react-dom_client.js?v=8bd2fca2:2628:42)
handleModalSubmit @ MyOrdersPage.jsx:263
