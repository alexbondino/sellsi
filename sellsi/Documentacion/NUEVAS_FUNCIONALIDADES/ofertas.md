QUIERO QUE HAGAS UN ANALISIS SUPER PROFUNDO DE TODO EL FLUJO

He Creado
OfferModal.jsx para comenzar con el proceso de ofertar por parte del comprador.
BuyerOffer.jsx para gestionar el estado de mis ofertas generadas.
SupplierOffer.jsx para Aceptar,Rechazar ofertas generadas por los compradores.


El flujo:
Una vez la Oferta es generada por el Comprador, se crea una especie de Orden de oferta, tanto para
BuyerOffer.jsx y SupplierOffer.jsx
esta oferta se muestra como Pendiente tanto en BuyerOffer.jsx y SupplierOffer.jsx, y una vez esta oferta es generada empieza a correr un timer de 48 horas hasta que esta oferta caduque, este timer se debe mostrar en BuyersOffers.jsx y SupplierOffers.jsx.

Si pasan 48 horas y la oferta sigue en pending, entonces esta automaticamente pasa a Caducada
Si la oferta es rechazada previa a 48 horas, entonces rechazada.
La Oferta puede ser Aprobada por parte del Supplier, entonces esta oferta pasa a ser Aceptada, y comienza un nuevo timer para BuyerOffer.jsx que comienza en 24 horas.
El comprador tendra 24 horas para agregar el producto al carro, mediante acciones. El boton de Cart abrira el AddToCartModal.jsx y una vez que el comprador haga la compra antes de las 24 horas, el timer se detiene y cambia a Compra Realizada.

Si el comprador no compra en 24 horas, entonces le aparecera a el Caducada. El proveedor seguira viendo Aceptada y el provedor tampoco vera el timer de Aceptada, eso es olo para Buyer/Comprador.

Este producto "Ofertado" tiene que ser identico a los productos actuales en cuanto a estructura a grandes rasgos, la unica diferencia sera que:
-Tiene un Precio y Cantidad unicos (este no obedece a pricetiers ni nada, el precio y cantidad es unico segun lo ofertado)
-Tendra un tag, el cual se mostrara en distintas instancias tales como CartItem,PaymentMethod,BuyersOrders,MyOrdersPage.jsx, etc el cual dira Ofertado.

Si por ejemplo yo compro 10 televisores ofertados y luego 10 televisores sin ofertar, en todos estos componentes: (CartItem,PaymentMethod,BuyersOrders,MyOrdersPage.jsx, etc el cual dira Ofertado) tiene que mostrarse claramente la separacion de items entre 10 Televisores y 10 Televisors (Ofertado), es basciamente como si fuese un objeto completamente distinto

Una vez el la oferta esta en Aceptado, automaticametne se descuenta el stock del producto (SOLO el stock)
si la oferta pasa a caducada por parte del BuyerOffer.jsx (osea no la pago despues de las 24 horas, entonces el stock se repone).
Para el Khipu index.ts estas funciones automaticamente descuentan stocks y generan pagos al hacer compras, si el producto es ofertado, entonces el stock no debe descontarlo como tal, ya que este ya fue descontado anteriormente, tiene que a lo mas validarlo que se desconto

comprador puede hacer maximo 2 ofertas (offermodal.jsx) por producto al mes
y un maximo de 5 ofertas mensuales por proveedor

QUE TABLAS SQL HABRIA QUE CREAR PARA ESTO?
ENTIENDES TODO LO QUE TE PIDO O TIENES DUDAS?

sellsi\sql supabase\querynew.sql