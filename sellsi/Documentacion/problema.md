Sigo teniendo problemas con la generacion de ordenes en Mis Pedidos, hice un refactor y los problemas persisten y surgieron otros nuevos:

1.-Al comprar un producto, la orden que se genera en BuyersOrders.jsx, no viene con el precio mapeado correctamente, el la seccion cantidad * precio, aparece cantidad * 0 "debido al fallback, ya que no encuentra el precio" esto nose si ocurre siempre, revisar

2.-el Chip de Procesando Pago sigue con problemas, sigue sin cambiarse a Pago Aceptado cuando payment_status = paid

3.-Las Notificaciones siguen sin funcionar, no se muestra ninguna en este proceso