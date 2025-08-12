Tenemos un gran trabajo que hacer, en este marketplace ya conectamos el pago del Cart con Khipu y Khipu esta enviando correctamente las varibales de
status
payment_status

necesitamos comenzar este proceso primero con sellsi\src\domains\buyer\pages\BuyerOrders.jsx
necesitamos conectar BuyerOrderds.jsx a payment_status, cuando payment_status = pending, se genere esta ORDEN y que esta diga dentro Procesando pago...
Idealmente utilizar supabase realtime (Nunca lo he utilizado me tendrias que ayudar a setearlo, sino utilizar un sistema de consultas cada 5 segundos u algo asi)
para que cuando payment_status = paid, entonces el Procesando pago... desaparezca y bueno de momento seria eso, ahora si payment_status entrega una respuesta fallida, la cual nose que valor podria tener, pero seria diferente de cualquiera de esas 2, obviamente un mensaje de que hubo un error con el pago. tal vez en https://docs.khipu.com pueda haber mas informacion de posibles variables que este pueda presentar.

ANALISIS PROFUNDO


vamos con esto primero, 
despues veremos de que ocurre en otros niveles cuando el pago se completa (reducir el stock del producto, aumentar la venta de proveedor, generar la orden en MyOrdersPage.jsx, generar la orden en AdminPanelTable.jsx, eliminar el producto del BuyerCart.jsx del usuario etc etc) todo esto lo haremos una vez lo primero este listo, ok?
vamos por parte
