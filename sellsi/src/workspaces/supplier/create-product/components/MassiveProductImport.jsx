import React, { useState } from 'react';
import ImportExcel from '../../../../ui-components/imports/ImportExcel';
import { downloadExcelTemplate } from '../../../../ui-components/templates/ExcelTemplateGenerator';
import { Box, Button, Alert, useTheme, useMediaQuery } from '@mui/material';

// Definición de los campos requeridos para el Excel con descripciones
const PRODUCT_IMPORT_FIELDS = [
  {
    key: 'productnm',
    label: 'Texto',
    description: 'Nombre completo del producto.',
  },
  {
    key: 'description',
    label: 'Texto',
    description: 'Descripción breve del producto.',
    optional: false,
  },
  {
    key: 'category',
    label: 'Número Entero',
    description: (
      <>
        Categoría a la que pertenece el producto.{' '}
        <a
          href="/ui-components/imports/category-dictionary"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#2E52B2',
            textDecoration: 'underline',
            fontWeight: 500,
          }}
        >
          [Diccionario de Categorías]
        </a>
      </>
    ),
  },
  {
    key: 'price',
    label: 'Número Entero',
    description: 'Precio unitario del producto.',
    optional: false,
  },
  {
    key: 'productqty',
    label: 'Número Entero',
    description: 'Cantidad disponible para la venta.',
    optional: false,
  },
  {
    key: 'minimum_purchase',
    label: 'Número Entero',
    description: 'Cantidad mínima que se puede comprar.',
    optional: false,
  },
  {
    key: 'delivery_regions',
    label: 'Números Enteros (lista separada por ;)',
    description: (
      <>
        Regiones de despacho.{' '}
        <a
          href="/ui-components/imports/region-dictionary"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#2E52B2',
            textDecoration: 'underline',
            fontWeight: 500,
          }}
        >
          [Diccionario de Regiones]
        </a>
      </>
    ),
    optional: false,
  },
  {
    key: 'delivery_prices',
    label: 'Números Enteros (lista separada por ;)',
    description:
      'Precios de entrega para cada región, en el mismo orden que esta.',
    optional: false,
  },
  {
    key: 'delivery_days',
    label: 'Números Enteros(lista separada por ;)',
    description:
      'Días de entrega para cada región, en el mismo orden que esta.',
    optional: false,
  },
  {
    key: 'image_urls',
    label: 'URLs (lista separada por ;)',
    description: 'URLs de las imágenes del producto.',
    optional: false,
  },
];

const MassiveProductImport = ({ open, onClose, onSuccess }) => {
  const [importError, setImportError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Para el template y el import, solo se pasan los keys
  const fieldKeys = PRODUCT_IMPORT_FIELDS.map(f => f.key);
  // Obtener el userId del localStorage
  const userId = localStorage.getItem('user_id');

  return (
    <Box>
      {/* Fila de botones */}
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1.5, sm: 2 },
          justifyContent: 'center',
          alignItems: 'stretch',
        }}
      >
        <Button
          variant="outlined"
          onClick={() =>
            downloadExcelTemplate(fieldKeys, 'productos_template.xlsx')
          }
          fullWidth={isMobile}
          sx={{
            textTransform: 'none',
            fontSize: { xs: '0.875rem', sm: '0.9375rem' },
          }}
        >
          Descargar template
        </Button>

        <ImportExcel
          table="products"
          fields={fieldKeys}
          userId={userId}
          onSuccess={data => {
            setImportError(null);
            if (onSuccess) onSuccess(data);
          }}
          // ← recibe errores desde ImportExcel y los muestra debajo de los botones
          onErrorChange={setImportError}
          buttonProps={{
            variant: 'contained',
            fullWidth: isMobile,
            sx: {
              textTransform: 'none',
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
            },
          }}
        />
      </Box>

      {/* Info: Feature solo disponible para productos de venta por unidad */}
      <Box
        sx={{
          color: '#d32f2f',
          fontWeight: 600,
          mb: 1.5,
          mt: 0.5,
          fontSize: { xs: '0.8rem', sm: '0.875rem' },
          textAlign: 'center',
          px: { xs: 1, sm: 0 },
        }}
      >
        Feature solo disponible para productos de venta por unidad. Venta por
        tramos disponible próximamente.
      </Box>

      {/* 🔴 Error justo debajo de los botones */}
      {importError && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            whiteSpace: 'pre-line',
            textAlign: 'left',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            '& .MuiAlert-message': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            },
          }}
        >
          {importError}
        </Alert>
      )}

      {/* Texto de ayuda / esquema de campos */}
      <Box
        sx={{
          color: 'text.secondary',
          fontSize: { xs: 14, sm: 16 },
          mx: 'auto',
          mt: 2,
        }}
      >
        <Box
          sx={{
            fontWeight: 500,
            mb: { xs: 2, sm: 3.75 },
            mt: { xs: 2, sm: 3.75 },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            textAlign: 'center',
          }}
        >
          Los campos requeridos en el Excel son:
        </Box>
        <Box
          component="ul"
          sx={{
            textAlign: 'left',
            pl: { xs: 2, sm: 3 },
            m: 0,
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          }}
        >
          {PRODUCT_IMPORT_FIELDS.map(field => (
            <li
              key={field.key}
              style={{
                marginBottom: isMobile ? 8 : 6,
                lineHeight: isMobile ? 1.4 : 1.5,
              }}
            >
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {field.key}
              </span>
              {field.optional ? (
                <span style={{ color: '#888', marginLeft: 4 }}>(opcional)</span>
              ) : null}
              {': '}
              <span style={{ fontWeight: 500 }}>{field.label}</span>
              <span style={{ color: '#888', marginLeft: 4 }}>
                – {field.description}
              </span>
            </li>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default MassiveProductImport;
