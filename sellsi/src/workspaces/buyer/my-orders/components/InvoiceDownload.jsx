import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { supabase } from '../../../../services/supabase';
import { downloadUrlAsBlobWithRateLimit } from '../../../../shared/utils/downloads/download';

/**
 * Helper component to download invoices with client-side throttling.
 * Extracted from BuyerOrders.jsx for reusability and maintainability.
 */
const InvoiceDownload = ({ invoicePath, documentType = 'documento', orderId }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-invoice-url', {
        body: { path: invoicePath },
      });
      if (error) throw error;
      const signedUrl = data?.url;
      if (!signedUrl) throw new Error('No se pudo generar la URL de descarga');

      const filename = (invoicePath.split('/')?.pop() || 'factura.pdf').replace(/\?.*$/, '');

      await downloadUrlAsBlobWithRateLimit({
        url: signedUrl,
        filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
        rateKey: `invoice:${orderId || invoicePath}`,
      });
    } catch (e) {
      const msg = String(e?.message || e || '');
      const status = e?.status || e?.statusCode || null;
      if (msg.startsWith('RATE_LIMITED:') || status === 429) {
        const seconds = msg.startsWith('RATE_LIMITED:') ? (msg.split(':')[1] || '') : '';
        alert(`Límite de descargas alcanzado. Intenta de nuevo en unos segundos.${seconds ? ` (${seconds}s)` : ''}`);
        return;
      }
      console.error('Error generando URL firmada:', e);
      alert('Error al generar descarga.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="caption" color="text.secondary">
        Tu {documentType === 'boleta' ? 'Boleta' : documentType === 'factura' ? 'Factura' : ''} está lista para ser descargada.
      </Typography>
      <Button
        size="small"
        variant="text"
        onClick={handleDownload}
        disabled={loading}
        sx={{
          border: 'none',
          boxShadow: 'none',
          textTransform: 'none',
          color: 'primary.main',
          p: 0,
          minWidth: 'auto',
          '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
        }}
      >
        {loading ? 'Generando...' : 'Descargar'}
      </Button>
    </Box>
  );
};

export default InvoiceDownload;
