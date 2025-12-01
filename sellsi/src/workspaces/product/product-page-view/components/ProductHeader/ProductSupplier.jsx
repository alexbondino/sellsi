/**
 * ProductSupplier - Información del proveedor
 *
 * Muestra:
 * - Avatar del proveedor
 * - Nombre (clickeable si está logueado)
 * - Badge de verificado
 */
import React from 'react';
import { Box, Typography, Avatar, Tooltip } from '@mui/material';
import { Verified as VerifiedIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  SUPPLIER_STYLES,
  normalizeProviderSlug,
} from '../../styles/productPageStyles';

const ProductSupplier = ({
  proveedor,
  logoUrl,
  isVerified = false,
  isLoggedIn = false,
  supplierId,
}) => {
  const navigate = useNavigate();

  const handleSupplierClick = () => {
    if (!isLoggedIn) return;

    const proveedorSlug = normalizeProviderSlug(proveedor);
    navigate(`/catalog/${proveedorSlug}/${supplierId || 'userid'}`);
  };

  return (
    <Box sx={SUPPLIER_STYLES.container}>
      <Avatar src={logoUrl} sx={SUPPLIER_STYLES.avatar}>
        {proveedor?.charAt(0)}
      </Avatar>

      <Typography
        variant="body1"
        sx={
          isLoggedIn
            ? SUPPLIER_STYLES.nameClickable
            : SUPPLIER_STYLES.nameNotClickable
        }
        onClick={isLoggedIn ? handleSupplierClick : undefined}
      >
        {proveedor}
      </Typography>

      {isVerified && (
        <Tooltip
          title="Este Proveedor ha sido verificado por Sellsi."
          placement="right"
          arrow
        >
          <VerifiedIcon sx={SUPPLIER_STYLES.verifiedIcon} />
        </Tooltip>
      )}
    </Box>
  );
};

export default ProductSupplier;
