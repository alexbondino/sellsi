Tenemos un gran trabajo que hacer, en este marketplace ya conectamos el pago del Cart con Khipu y Khipu esta enviando correctamente las varibales de
status
payment_status


1)-----ESTO DE ABAJO YA ESTA LISTO---------
necesitamos comenzar este proceso primero con sellsi\src\domains\buyer\pages\BuyerOrders.jsx
necesitamos conectar BuyerOrderds.jsx a payment_status, cuando payment_status = pending, se genere esta ORDEN y que esta diga dentro Procesando pago...
Idealmente utilizar supabase realtime (Nunca lo he utilizado me tendrias que ayudar a setearlo, sino utilizar un sistema de consultas cada 5 segundos u algo asi)
para que cuando payment_status = paid, entonces el Procesando pago... desaparezca y bueno de momento seria eso, ahora si payment_status entrega una respuesta fallida, la cual nose que valor podria tener, pero seria diferente de cualquiera de esas 2, obviamente un mensaje de que hubo un error con el pago. tal vez en https://docs.khipu.com pueda haber mas informacion de posibles variables que este pueda presentar.

------ESTO DE ARRIBA YA ESTA LISTO-------

ANALISIS PROFUNDO


2) VAMOS CON ESTO AHORA, una vez payment_status=paid:
revisa query.sql que es mi base de datos en caso de que necesites información
NECESITO UN ANALISIS PROFUNDO, PARA VER EN DONDE PEGARIA ESTO, ALGUNOS LUGARES QUE YO TENGO EN MENTE:
BuyerCart.jsx (eliminar items del carro)
MyOrdersPage.jsx (generar orden para supplier)
ProviderHome.jsx (aumenta el valor de Ventas Este Mes, conectando el producto vendido con el proveedor)
ProductCardSupplierContext.jsx  (aumenta el valor de Ventas de dicho producto, conectando el producto vendido con el proveedor)
Disminuir el Stock del Producto, creo que esto seria productqty
 y creo que eso seria por ahora