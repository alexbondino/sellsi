a)
Login al panel de control:

Como administrador sellsi quiero poder ingresar al panel de control para hacer gestion del pago a proveedores y compradores.

Criterios de aceptación:

La ruta debe ser admin.sellsi.xyz

Debe crearse una nueva tabla en supabase llamada control_panel_users. Debe ser ultra segura y contener los siguientes campos al menos: usuario y contraseña.

Solo debo poder ingresar si estoy en la tabla de supabase control_panel_users.

b)
Tabla padre panel de control:

Descripción

Como administrador quiero poder saber e interactuar con las distintas solicitudes para gestionarlas.

Criterios de aceptación:

Agregar tabla que contenga:

Proveedor: 

Comprador

Ticket

Dirección entrega

Fecha solicitada

Fecha entrega

Venta

Estado: Puede ser depositado a sellsi, en proceso dedespacho, entregado, entrega rechazada, pagado al proveedor, cancelado y pago devuelto al proveedor. 

Acciones: Debe contener una lupa

Los registros deben crearse solamente si kiphu detecta un depósito a la cuenta de sellsi. De momento, solamente probar insertando columnas a una tabla de supabase llamada control_panel.

El estado inicial de todo producto es: depositado a sellsi.

c)
Poder confirmar pago de comprador:

Descripción

Como administrador quiero poder confirmar la recepción de pago del comprador hacia sellsi para poder comenzar a gestionar todo.

Criterios de aceptación:

Para los tags de pagado a sellsi, al hacer click en la acción de la tabla, debe abrirse un modal. 

El modal debe contener información de la transaccion y un descargable que tenga el comprobante de pago.

Al dar click en confirmar depósito, se le debe enviar un mail al comprador diciendo que su deposito fue confirmado, se debe crear el registro en la tabla de requests en supabase con toda la información correspondiente y el estado en el panel de control debe ser “En proceso de despacho”.

d)
 Poder rechazar pago de comprador:

 Descripción

Como administrador quiero poder rechazar la recepción de pago del comprador hacia sellsi para evitar hacer envíos a agentes que no pagaron.

Criterios de aceptación:

Al dar click en rechazar en el modal de acción de depositado a sellsi, debe abrirse una segunda parte del modal donde se detalle el motivo del rechazo y se puedan adjuntar documentos correspondientes.

Debe enviarse un mail al comprador detallando todo esto.

El registro debe pasar a tener el tag: pago rechazado.

Debe haber un proceso deconfirmación de que se quiere rechazar

e)
Poder devolver dinero a comprador:

Descripción

Como administrador quiero poder devolver el pago al comprador para pagarle al comprador en caso de cancelación del pedido..

Criterios de aceptación:

Cuando el comprador cancele el pedido, el tag debe pasarse a “cancelado”

Al hacer click en la acción de “cancelado”, deben mostrarse los datos del deposito al comprador

Se debe poder subir un archivo de. comprobante de pago en el mismo modal.

Al dar click en “confirmar deposito”, se debe enviar un mail a este confirmando el pago junto con el documento adjunto,  y pasar el estado en el panel de control a “devuelto al comprador”

Debe haber un proceso de confirmación de que se quiere  confirmar
