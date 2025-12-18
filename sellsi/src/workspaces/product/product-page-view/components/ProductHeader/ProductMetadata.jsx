/**
 * ProductMetadata - Stock, compra mínima y chips de documentos
 *
 * Muestra:
 * - Chips de tipos de documento (factura, boleta, etc.)
 * - Stock disponible
 * - Compra mínima
 */
import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Assignment } from '@mui/icons-material';
import { useSmartSkeleton } from '../../hooks/useSmartSkeleton';
import { DocumentTypesChipsSkeleton } from '../skeletons/DocumentTypesChipsSkeleton';
import { formatNumber } from '../../../../../shared/utils/formatters/numberFormatters';
import { METADATA_STYLES } from '../../styles/productPageStyles';

const ProductMetadata = ({
  stock,
  compraMinima,
  availableOptions,
  loadingDocumentTypes,
  isMobile = false,
  supplierMinimumAmount = 0,
}) => {
  const showDocSkeleton = useSmartSkeleton(loadingDocumentTypes);

  /**
   * Renderiza los chips de tipos de documento
   */
  const renderDocumentChips = () => {
    // Si está cargando, mostrar skeleton
    if (showDocSkeleton) {
      return <DocumentTypesChipsSkeleton isMobile={isMobile} />;
    }

    // Si hay opciones disponibles
    if (availableOptions && availableOptions.length > 0) {
      // Si solo hay "ninguno", mostrar texto especial
      if (
        availableOptions.length === 1 &&
        availableOptions[0].value === 'ninguno'
      ) {
        return (
          <Typography
            variant="body2"
            sx={{ color: 'text.primary', fontWeight: 600 }}
          >
            Proveedor no ofrece documento tributario
          </Typography>
        );
      }

      // Mostrar chips filtrados (sin "ninguno")
      return availableOptions
        .filter(option => option.value !== 'ninguno')
        .map(option => (
          <Chip
            key={option.value}
            label={option.label}
            size={isMobile ? 'medium' : 'small'}
            sx={METADATA_STYLES.chip}
          />
        ));
    }

    // Fallback: opciones por defecto
    return (
      <>
        <Chip
          label="Factura"
          size={isMobile ? 'medium' : 'small'}
          sx={METADATA_STYLES.chip}
        />
        <Chip
          label="Boleta"
          size={isMobile ? 'medium' : 'small'}
          sx={METADATA_STYLES.chip}
        />
      </>
    );
  };

  /**
   * Renderiza la información de stock
   */
  const renderStock = () => {
    if (stock === 0) {
      return (
        <Typography variant="body2" sx={METADATA_STYLES.stockOutOfStock}>
          <Assignment sx={{ fontSize: 18, color: 'error.main' }} />
          Producto agotado
        </Typography>
      );
    }

    return (
      <Typography variant="body2" sx={METADATA_STYLES.stockText}>
        <b>Stock:</b> {formatNumber(stock)} unidades
      </Typography>
    );
  };

  return (
    <Box sx={METADATA_STYLES.container}>
      {/* Fila 1: Chips de facturación dinámicos */}
      <Box sx={METADATA_STYLES.chipsContainer}>{renderDocumentChips()}</Box>

      {/* Fila 2: Stock */}
      <Box sx={METADATA_STYLES.stockRow}>{renderStock()}</Box>

      {/* Fila 3: Compra mínima */}
      <Box sx={METADATA_STYLES.stockRow}>
        <Typography variant="body2" sx={METADATA_STYLES.stockText}>
          <b>Unidades mínimas a comprar:</b> {formatNumber(compraMinima)}
        </Typography>
      </Box>

      {/* Fila 4: Compra Mínima Proveedor - Siempre visible */}
      <Box sx={METADATA_STYLES.stockRow}>
        <Typography variant="body2" sx={METADATA_STYLES.stockText}>
          <b>Compra mínima proveedor:</b> ${formatNumber(supplierMinimumAmount)}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProductMetadata;
