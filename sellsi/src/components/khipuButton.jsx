// src/KhipuButton.jsx
// Versión segura y correcta para producción

import React, { useState } from 'react';
// Asumo que tienes un archivo para inicializar el cliente de Supabase

import { supabase } from '../services/supabase';
function KhipuButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Llamamos a nuestra Edge Function de forma segura
      const { data, error: functionError } = await supabase.functions.invoke(
        'create-payment-khipu'
      );

      // 2. Manejamos posibles errores de la función
      if (functionError) {
        throw functionError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // 3. Si todo sale bien, redirigimos al usuario a la URL de pago
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error('No se recibió una URL de pago desde el servidor.');
      }
    } catch (err) {
      console.error('Error al iniciar el proceso de pago:', err);
      setError('Hubo un problema al iniciar el pago. Inténtalo de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handlePayment} disabled={isLoading}>
        {isLoading ? 'Generando pago...' : 'Pagar $500 con Khipu'}
      </button>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}

export default KhipuButton;
