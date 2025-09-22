ShippingInfoValidationModal.jsx:24 🔍 [MODAL DEBUG] openIfIncomplete check:
ShippingInfoValidationModal.jsx:25   - loading: true
ShippingInfoValidationModal.jsx:26   - complete: false
ShippingInfoValidationModal.jsx:27   - isLoading (direct): true
ShippingInfoValidationModal.jsx:28   - isComplete (direct): false
ShippingInfoValidationModal.jsx:35 ❌ [MODAL DEBUG] NO abriendo modal - shipping completo o cargando
supabase.js:96 [auth:getUser] cache hit
AddToCartModal.jsx:27 [AddToCartModal] enrichProductWithRegions - product already has regions {productId: 'e6d1201e-57d6-44f3-901b-835701615e89', existingRegions: 1}
scheduler.development.js:14 [Violation] 'message' handler took 160ms
useProductShippingValidationOnOpen.js:25 🎯 [MODAL DEBUG] validateShippingOnDemand
useProductShippingValidationOnOpen.js:26 🔍 effectiveUserRegion: metropolitana
useProductShippingValidationOnOpen.js:27 🔍 hookUserRegion: metropolitana
useProductShippingValidationOnOpen.js:28 🔍 userRegionProp: metropolitana
useProductShippingValidationOnOpen.js:29 🔍 enrichedProduct: {id: 'e6d1201e-57d6-44f3-901b-835701615e89', productid: 'e6d1201e-57d6-44f3-901b-835701615e89', supplier_id: 'e9029faf-6c7a-44b9-80f2-e33bbef06948', nombre: 'Moscato Pink', proveedor: 'ealvarezvaccaro', …}
useProductShippingValidationOnOpen.js:30 🔍 isLoadingRegions: false
useProductShippingValidationOnOpen.js:31 🔍 isLoadingUserProfile: false
useProductShippingValidationOnOpen.js:40 ✅ INICIANDO VALIDACIÓN
useProductShippingValidationOnOpen.js:45 🔄 Usando validateSingleProduct (con hookUserRegion)
useUnifiedShippingValidation.js:143 🚚 [SHIPPING DEBUG] validateProductShipping
useUnifiedShippingValidation.js:144 📦 Producto ID: e6d1201e-57d6-44f3-901b-835701615e89
useUnifiedShippingValidation.js:145 👤 Usuario región (effective): metropolitana
useUnifiedShippingValidation.js:146 👤 Usuario región (hook): metropolitana
useUnifiedShippingValidation.js:147 👤 Usuario región (prop): metropolitana
useUnifiedShippingValidation.js:168 🏭 Producto shippingRegions: ['metropolitana']
useUnifiedShippingValidation.js:169 🏭 Producto delivery_regions: undefined
useUnifiedShippingValidation.js:170 🏭 Producto shipping_regions: undefined
useUnifiedShippingValidation.js:171 🏭 Producto product_delivery_regions: undefined
useUnifiedShippingValidation.js:172 📍 Regiones finales para validar: ['metropolitana']
useUnifiedShippingValidation.js:186 🔍 COMPARANDO REGIONES:
useUnifiedShippingValidation.js:196    "metropolitana" === "metropolitana" ? true
useUnifiedShippingValidation.js:200 ✅ Región coincidente encontrada: metropolitana
useUnifiedShippingValidation.js:224 ✅ PRODUCTO COMPATIBLE - canShip: true
useUnifiedShippingValidation.js:225    Días: N/A, Costo: 0
useProductShippingValidationOnOpen.js:51 📊 RESULTADO DE VALIDACIÓN: {state: 'compatible', message: 'N/A días hábiles - $0', canShip: true, shippingInfo: {…}}
scheduler.development.js:14 [Violation] 'message' handler took 276ms
useShippingInfoValidation.js:248 🏁 [SHIPPING DEBUG] Hook instance #73 montado (active: true)
useShippingInfoValidation.js:298 👂 [SHIPPING DEBUG] Instance #73 - Listener registrado para user-changed
useShippingInfoValidation.js:248 🏁 [SHIPPING DEBUG] Hook instance #75 montado (active: false)
useShippingInfoValidation.js:298 👂 [SHIPPING DEBUG] Instance #75 - Listener registrado para user-changed
useShippingInfoValidation.js:248 🏁 [SHIPPING DEBUG] Hook instance #77 montado (active: false)
useShippingInfoValidation.js:298 👂 [SHIPPING DEBUG] Instance #77 - Listener registrado para user-changed
useShippingInfoValidation.js:248 🏁 [SHIPPING DEBUG] Hook instance #79 montado (active: false)
useShippingInfoValidation.js:298 👂 [SHIPPING DEBUG] Instance #79 - Listener registrado para user-changed
useShippingInfoValidation.js:248 🏁 [SHIPPING DEBUG] Hook instance #81 montado (active: false)
useShippingInfoValidation.js:298 👂 [SHIPPING DEBUG] Instance #81 - Listener registrado para user-changed
useShippingInfoValidation.js:248 🏁 [SHIPPING DEBUG] Hook instance #83 montado (active: false)
useShippingInfoValidation.js:298 👂 [SHIPPING DEBUG] Instance #83 - Listener registrado para user-changed
useShippingInfoValidation.js:248 🏁 [SHIPPING DEBUG] Hook instance #85 montado (active: false)
useShippingInfoValidation.js:298 👂 [SHIPPING DEBUG] Instance #85 - Listener registrado para user-changed
useShippingInfoValidation.js:263 🚮 [SHIPPING DEBUG] Hook instance #73 desmontado (active: true)
useShippingInfoValidation.js:301 🔇 [SHIPPING DEBUG] Instance #73 - Removiendo listener user-changed
useShippingInfoValidation.js:248 🏁 [SHIPPING DEBUG] Hook instance #73 montado (active: true)
useShippingInfoValidation.js:298 👂 [SHIPPING DEBUG] Instance #73 - Listener registrado para user-changed
useShippingInfoValidation.js:263 🚮 [SHIPPING DEBUG] Hook instance #75 desmontado (active: false)
useShippingInfoValidation.js:301 🔇 [SHIPPING DEBUG] Instance #75 - Removiendo listener user-changed
useShippingInfoValidation.js:248 🏁 [SHIPPING DEBUG] Hook instance #75 montado (active: false)
useShippingInfoValidation.js:298 👂 [SHIPPING DEBUG] Instance #75 - Listener registrado para user-changed
useShippingInfoValidation.js:263 🚮 [SHIPPING DEBUG] Hook instance #77 desmontado (active: false)
useShippingInfoValidation.js:301 🔇 [SHIPPING DEBUG] Instance #77 - Removiendo listener user-changed
useShippingInfoValidation.js:248 🏁 [SHIPPING DEBUG] Hook instance #77 montado (active: false)
useShippingInfoValidation.js:298 👂 [SHIPPING DEBUG] Instance #77 - Listener registrado para user-changed
useShippingInfoValidation.js:263 🚮 [SHIPPING DEBUG] Hook instance #79 desmontado (active: false)
useShippingInfoValidation.js:301 🔇 [SHIPPING DEBUG] Instance #79 - Removiendo listener user-changed
useShippingInfoValidation.js:248 🏁 [SHIPPING DEBUG] Hook instance #79 montado (active: false)
useShippingInfoValidation.js:298 👂 [SHIPPING DEBUG] Instance #79 - Listener registrado para user-changed
useShippingInfoValidation.js:263 🚮 [SHIPPING DEBUG] Hook instance #81 desmontado (active: false)
useShippingInfoValidation.js:301 🔇 [SHIPPING DEBUG] Instance #81 - Removiendo listener user-changed
useShippingInfoValidation.js:248 🏁 [SHIPPING DEBUG] Hook instance #81 montado (active: false)
useShippingInfoValidation.js:298 👂 [SHIPPING DEBUG] Instance #81 - Listener registrado para user-changed
useShippingInfoValidation.js:263 🚮 [SHIPPING DEBUG] Hook instance #83 desmontado (active: false)
useShippingInfoValidation.js:301 🔇 [SHIPPING DEBUG] Instance #83 - Removiendo listener user-changed
useShippingInfoValidation.js:248 🏁 [SHIPPING DEBUG] Hook instance #83 montado (active: false)
useShippingInfoValidation.js:298 👂 [SHIPPING DEBUG] Instance #83 - Listener registrado para user-changed
useShippingInfoValidation.js:263 🚮 [SHIPPING DEBUG] Hook instance #85 desmontado (active: false)
useShippingInfoValidation.js:301 🔇 [SHIPPING DEBUG] Instance #85 - Removiendo listener user-changed
useShippingInfoValidation.js:248 🏁 [SHIPPING DEBUG] Hook instance #85 montado (active: false)
useShippingInfoValidation.js:298 👂 [SHIPPING DEBUG] Instance #85 - Listener registrado para user-changed
[Violation] Forced reflow while executing JavaScript took 32ms
ShippingInfoValidationModal.jsx:24 🔍 [MODAL DEBUG] openIfIncomplete check:
ShippingInfoValidationModal.jsx:25   - loading: true
ShippingInfoValidationModal.jsx:26   - complete: false
ShippingInfoValidationModal.jsx:27   - isLoading (direct): true
ShippingInfoValidationModal.jsx:28   - isComplete (direct): false
ShippingInfoValidationModal.jsx:35 ❌ [MODAL DEBUG] NO abriendo modal - shipping completo o cargando
supabase.js:96 [auth:getUser] cache hit
ShippingInfoValidationModal.jsx:24 🔍 [MODAL DEBUG] openIfIncomplete check:
ShippingInfoValidationModal.jsx:25   - loading: true
ShippingInfoValidationModal.jsx:26   - complete: false
ShippingInfoValidationModal.jsx:27   - isLoading (direct): true
ShippingInfoValidationModal.jsx:28   - isComplete (direct): false
ShippingInfoValidationModal.jsx:35 ❌ [MODAL DEBUG] NO abriendo modal - shipping completo o cargando
AddToCartModal.jsx:27 [AddToCartModal] enrichProductWithRegions - product already has regions {productId: '3f7bfdad-cfeb-4619-a715-2d23b706e21d', existingRegions: 1}
useProductShippingValidationOnOpen.js:25 🎯 [MODAL DEBUG] validateShippingOnDemand
useProductShippingValidationOnOpen.js:26 🔍 effectiveUserRegion: metropolitana
useProductShippingValidationOnOpen.js:27 🔍 hookUserRegion: metropolitana
useProductShippingValidationOnOpen.js:28 🔍 userRegionProp: metropolitana
useProductShippingValidationOnOpen.js:29 🔍 enrichedProduct: {id: '3f7bfdad-cfeb-4619-a715-2d23b706e21d', productid: '3f7bfdad-cfeb-4619-a715-2d23b706e21d', supplier_id: 'e9029faf-6c7a-44b9-80f2-e33bbef06948', nombre: 'Nutella 3kg', proveedor: 'ealvarezvaccaro', …}
useProductShippingValidationOnOpen.js:30 🔍 isLoadingRegions: false
useProductShippingValidationOnOpen.js:31 🔍 isLoadingUserProfile: false
useProductShippingValidationOnOpen.js:40 ✅ INICIANDO VALIDACIÓN
useProductShippingValidationOnOpen.js:45 🔄 Usando validateSingleProduct (con hookUserRegion)
useUnifiedShippingValidation.js:143 🚚 [SHIPPING DEBUG] validateProductShipping
useUnifiedShippingValidation.js:144 📦 Producto ID: 3f7bfdad-cfeb-4619-a715-2d23b706e21d
useUnifiedShippingValidation.js:145 👤 Usuario región (effective): metropolitana
useUnifiedShippingValidation.js:146 👤 Usuario región (hook): metropolitana
useUnifiedShippingValidation.js:147 👤 Usuario región (prop): metropolitana
useUnifiedShippingValidation.js:168 🏭 Producto shippingRegions: ['metropolitana']
useUnifiedShippingValidation.js:169 🏭 Producto delivery_regions: undefined
useUnifiedShippingValidation.js:170 🏭 Producto shipping_regions: undefined
useUnifiedShippingValidation.js:171 🏭 Producto product_delivery_regions: undefined
useUnifiedShippingValidation.js:172 📍 Regiones finales para validar: ['metropolitana']
useUnifiedShippingValidation.js:186 🔍 COMPARANDO REGIONES:
useUnifiedShippingValidation.js:196    "metropolitana" === "metropolitana" ? true
useUnifiedShippingValidation.js:200 ✅ Región coincidente encontrada: metropolitana
useUnifiedShippingValidation.js:224 ✅ PRODUCTO COMPATIBLE - canShip: true
useUnifiedShippingValidation.js:225    Días: N/A, Costo: 0
useProductShippingValidationOnOpen.js:51 📊 RESULTADO DE VALIDACIÓN: {state: 'compatible', message: 'N/A días hábiles - $0', canShip: true, shippingInfo: {…}}
thumbnailMetrics.js:60 [THUMBS_METRIC] [{"ts":1758129632310,"type":"cache_promote","productId":"351857c1-d526-4f75-a292-22d7bd624fd3","fromPhase":"thumbnails_ready"},{"ts":1758129632321,"type":"cache_promote","productId":"67ec076a-b791-4a0d-a877-a22effd6b443","fromPhase":"thumbnails_ready"},{"ts":1758129632324,"type":"cache_promote","productId":"c93aba57-2b7a-4b3c-bb22-215bab7d1002","fromPhase":"thumbnails_ready"},{"ts":1758129632328,"type":"cache_promote","productId":"d7dbea72-e566-43f3-846f-4de72697732f","fromPhase":"thumbnails_ready"},{"ts":1758129632331,"type":"cache_promote","productId":"38b6c9bb-e3d1-4f78-9360-51028d2a77c5","fromPhase":"thumbnails_ready"},{"ts":1758129632342,"type":"cache_promote","productId":"456b8cd8-fea7-40c5-b7f7-61fd18f67f28","fromPhase":"thumbnails_ready"},{"ts":1758129632343,"type":"cache_promote","productId":"e6d1201e-57d6-44f3-901b-835701615e89","fromPhase":"thumbnails_ready"},{"ts":1758129632345,"type":"cache_promote","productId":"3f7bfdad-cfeb-4619-a715-2d23b706e21d","fromPhase":"thumbnails_ready"},{"ts":1758129632346,"type":"cache_promote","productId":"22ccd7b9-a315-4e2a-9f50-a19a30299042","fromPhase":"thumbnails_ready"},{"ts":1758129632347,"type":"cache_promote","productId":"cda6fc70-c8b8-42f7-8815-29a5d45bc0fa","fromPhase":"thumbnails_ready"},{"ts":1758129632348,"type":"cache_promote","productId":"7cff66d4-72f0-46b4-9fcd-d1cffaebf02d","fromPhase":"thumbnails_ready"},{"ts":1758129632348,"type":"cache_promote","productId":"e5839f21-c585-4e4c-9923-321f8bd1a847","fromPhase":"thumbnails_ready"},{"ts":1758129632349,"type":"cache_promote","productId":"747c6ebb-1dc7-4df6-8e41-832c46be79ee","fromPhase":"thumbnails_ready"},{"ts":1758129632350,"type":"cache_promote","productId":"3b710291-ae98-4376-b25d-56b65b30a0da","fromPhase":"thumbnails_ready"},{"ts":1758129632350,"type":"cache_promote","productId":"4e2da37f-c9f0-4425-a9eb-1328839849e7","fromPhase":"thumbnails_ready"},{"ts":1758129632351,"type":"cache_promote","productId":"be5a4e9e-9e85-4a12-afe5-acdddcb535a7","fromPhase":"thumbnails_ready"},{"ts":1758129632352,"type":"cache_promote","productId":"affeed6a-4a2d-4d85-9d08-2287b837e9b3","fromPhase":"thumbnails_ready"},{"ts":1758129632363,"type":"cache_promote","productId":"5a05b070-dee3-4d17-938e-73ce5649c70f","fromPhase":"thumbnails_ready"},{"ts":1758129632364,"type":"cache_promote","productId":"afaff223-5d68-4dac-a272-194edb3f80ef","fromPhase":"thumbnails_ready"},{"ts":1758129632402,"type":"cache_promote","productId":"a9604229-1961-4d1b-98cf-3bcf2ad6fb24","fromPhase":"thumbnails_ready"},{"ts":1758129655239,"type":"cache_promote","productId":"e3ad4277-f44b-4f55-aa5a-1b6015696550","fromPhase":"thumbnails_ready"},{"ts":1758129655244,"type":"cache_promote","productId":"1ea40ad0-c8a3-4799-ae12-424fb1b96a8d","fromPhase":"thumbnails_ready"},{"ts":1758129655246,"type":"cache_promote","productId":"8c669d4e-a0c9-4459-84c1-8eab4049f5f2","fromPhase":"thumbnails_ready"},{"ts":1758129655247,"type":"cache_promote","productId":"b54f0f2c-ab1d-4e8b-b6e9-9c1a253d0d46","fromPhase":"thumbnails_ready"},{"ts":1758129655273,"type":"cache_promote","productId":"f3edcd3c-6e5d-4033-a7ee-3b91dfc912ff","fromPhase":"thumbnails_ready"},{"ts":1758129655275,"type":"cache_promote","productId":"22fdf577-fa5c-47c0-b7af-526ab8747c2c","fromPhase":"thumbnails_ready"},{"ts":1758129655427,"type":"cache_promote","productId":"d677c35e-ef84-438c-87f7-680082073e46","fromPhase":"thumbnails_ready"}]
