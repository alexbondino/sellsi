import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { createSignedInvoiceUrl } from '../../../../services/storage/invoiceStorageService';

/**
 * Helper component to download invoices with client-side throttling.
 * Extracted from BuyerOrders.jsx for reusability and maintainability.
 */
const InvoiceDownload = ({ invoicePath, documentType = 'documento', orderId }) => {
  const [loading, setLoading] = useState(false);

  const DOWNLOAD_LIMIT_COUNT = 5; // max attempts
  const DOWNLOAD_WINDOW_MS = 60 * 1000; // per 60 seconds
  const storageKey = `invoice_downloads_${orderId}`;

  const canDownload = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return true;
      const arr = JSON.parse(raw);
      const now = Date.now();
      const recent = arr.filter(ts => now - ts < DOWNLOAD_WINDOW_MS);
      return recent.length < DOWNLOAD_LIMIT_COUNT;
    } catch (e) {
      return true;
    }
  };

  const recordDownload = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(Date.now());
      // Keep only last N to avoid growing forever
      const pruned = arr.slice(-DOWNLOAD_LIMIT_COUNT * 2);
      localStorage.setItem(storageKey, JSON.stringify(pruned));
    } catch (e) {
      // ignore
    }
  };

  const handleDownload = async () => {
    if (!canDownload()) {
      alert('Límite de descargas alcanzado. Intenta de nuevo en un momento.');
      return;
    }

    setLoading(true);
    try {
      // QUICK WIN: usar edge function segura para validar ownership antes de generar URL
      const token = localStorage.getItem('sb:token') || localStorage.getItem('access_token') || localStorage.getItem('sb-access-token');
      const endpoint = `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/get-invoice-url`;
      let signedUrl = null;
      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ path: invoicePath })
        });
        if (resp.ok) {
          const json = await resp.json();
          signedUrl = json.url || null;
        } else {
          // Fallback a método antiguo sólo si 404/403 para no romper UX (se puede retirar luego)
          if (resp.status === 404 || resp.status === 403) {
            // no fallback para seguridad estricta; mostrar error
            const errJson = await resp.json().catch(() => ({}));
            alert(errJson.error || 'No autorizado para descargar esta factura.');
            return;
          } else {
            // fallback legacy
            const legacy = await createSignedInvoiceUrl(invoicePath, 60);
            signedUrl = legacy?.data?.signedUrl || null;
          }
        }
      } catch (edgeErr) {
        // fallback legacy en caso de fallo de red a función
        try {
          const legacy = await createSignedInvoiceUrl(invoicePath, 60);
          signedUrl = legacy?.data?.signedUrl || null;
        } catch (_) {}
      }
      if (!signedUrl) {
        alert('No se pudo generar la URL de descarga. Intenta más tarde.');
        return;
      }
      recordDownload();
      // Intento 1: descarga directa creando un blob
      try {
        const resp = await fetch(signedUrl);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        // Derivar nombre de archivo desde el path original
        const filename = (invoicePath.split('/')?.pop() || 'factura.pdf').replace(/\?.*$/, '');
        a.href = url;
        a.download = filename.endsWith('.pdf') ? filename : filename + '.pdf';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 250);
      } catch (e) {
        // Fallback: abrir en nueva pestaña para que el navegador gestione la vista previa
        window.open(signedUrl, '_blank');
      }
    } catch (e) {
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
