const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();

app.use(cors());
app.use(express.json());

const receiver_id = 'TU_RECEIVER_ID';
const secret_key = 'TU_SECRET_KEY';

function signParams(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  const baseString = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
  return crypto.createHmac('sha256', secret).update(baseString).digest('hex');
}

app.post('/create-payment', (req, res) => {
  const params = {
    receiver_id,
    subject: 'Pago de prueba',
    body: 'Depósito directo por $200',
    amount: '200.00',
    currency: 'CLP',
    transaction_id: 'TX-' + Date.now(),
    return_url: 'https://tu-sitio.com/pago-exitoso',
    cancel_url: 'https://tu-sitio.com/pago-cancelado',
    notify_url: 'https://tu-sitio.com/api/notificacion-khipu',
    method: 'SIMPLE_TRANSFER',
  };

  const signature = signParams(params, secret_key);
  const urlParams = new URLSearchParams({ ...params, hash: signature });

  res.json({
    redirect_url: `https://khipu.com/api/2.0/payments/create?${urlParams.toString()}`,
  });
});

app.listen(3001, () => {
  console.log('Servidor escuchando en puerto 3001');
});
