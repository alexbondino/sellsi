Crear cuenta de Cobro

Definir banco
Ingresar al banco desde ahí
Vigencia: 12 meses, por lo menos para personas naturales
Seleccionar plan de cobro
Aceptar terminos y condiciones

Obtener APi Keys

Ingresar  Opciones de la cuenta
Copiar y pegar api keys de la sección “Para integrar Kiphu a tu sitio Web”

Integración con Sellsi

Crear orden de pago.La URL en notify_url genera la señal que dice que el pago fué aprobado. Lo más importante es el campo status
Si status es igual a "done", significa que el pago fue exitoso y el dinero fue conciliado.
Con el transaction_id que recibes, puedes buscar la orden en tu base de datos y marcarla como PAGADA.
{
  "subject": "Orden de compra #456", – Asunto de descripción del cobro

  "amount": "25000", – Monto de la transacción

  "currency": "CLP", – Currency

  "transaction_id": "ORDEN-456-XYZ", – Identificador interno de la transacción. Es la   clave que conecta el pago en Khipu con la orden en tu base de datos.

  "return_url": "https://tusitio.com/pago/resultado", – Es la URL de tu sitio web a la que Khipu redirigirá al cliente después de que complete el pago (o intente completarlo).

  "cancel_url": "https://tusitio.com/pago/cancelado", – Es la URL a la que Khipu redirigirá al cliente si este decide cancelar el pago haciendo clic en un botón de "cancelar" o "volver al comercio".

  "notify_url": "https://api.tusitio.com/webhook/khipu-confirmacion" – Es la URL de tu servidor (backend) donde Khipu enviará la notificación automática (webhook) para confirmar el estado final del pago. Esta es la única fuente de verdad para saber si un pago fue exitoso.
}


Verificar la firma de seguridad: Cualquiera podría intentar enviar una petición falsa a tu notify_url para activar un pedido gratis. Para evitar esto, Khipu "firma" cada notificación con tu llave secreta. Debes verificar que esta firma sea válida.
Cabecera (Header): Cada notificación de Khipu incluye una cabecera llamada x-khipu-signature.
Verificación: Debes usar tu llave secreta (secret) para generar una firma HMAC-SHA256 con los datos de la notificación y compararla con la que viene en la cabecera. Si coinciden, la notificación es legítima.

import crypto from 'crypto';

/**
 * Función para verificar la firma de un webhook de Khipu.
 * @param {string} requestBody - El cuerpo de la petición en formato texto crudo.
 * @param {string} signatureHeader - El valor de la cabecera 'x-khipu-signature'.
 * @param {string} secret - Tu llave secreta de Khipu.
 * @returns {boolean} - True si la firma es válida, false en caso contrario.
 */
function verifyKhipuSignature(requestBody, signatureHeader, secret) {
  // Extraer el timestamp y la firma de la cabecera
  const parts = signatureHeader.split(',');
  const timestamp = parts.find(p => p.startsWith('t=')).split('=')[1];
  const signature = parts.find(p => p.startsWith('s=')).split('=')[1];

  // Crear la cadena de texto que se firmó originalmente
  const stringToSign = `${timestamp}.${requestBody}`;

  // Generar la firma esperada usando tu llave secreta
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(stringToSign)
    .digest('hex');
  
  // Comparar de forma segura para evitar ataques de temporización
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// --- Uso dentro de tu endpoint ---
// (Asegúrate de tener acceso al cuerpo crudo/raw de la petición)

// const rawBody = req.rawBody; 
// const signature = req.headers['x-khipu-signature'];
// const secret = process.env.KHIPU_SECRET_KEY; // Tu llave secreta

// if (verifyKhipuSignature(rawBody, signature, secret)) {
//   // ✅ La notificación es auténtica.
//   const paymentData = JSON.parse(rawBody);
//   if (paymentData.status === 'done') {
//     // 🚀 ¡Pago confirmado!
//     // Actualiza tu base de datos con el paymentData.transaction_id
//   }
// } else {
//   // 🛑 ¡ALERTA! Firma inválida. Ignorar esta notificación.
// }






API: 
https://docs.khipu.com/apis/v3/instant-payments/openapi/other/postpaymentconfirmbyid
