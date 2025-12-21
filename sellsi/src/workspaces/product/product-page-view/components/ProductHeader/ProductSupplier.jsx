/**
 * ProductSupplier - Información del proveedor
 *
 * Muestra:
 * - Avatar del proveedor
 * - Nombre (clickeable si está logueado) en un contenedor tipo tag
 * - Badge de verificado
 */
import React from 'react';
import { Box, Typography, Avatar, Tooltip, Chip } from '@mui/material';
import {
  Verified as VerifiedIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
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
      <Chip
        avatar={
          <Avatar
            src={logoUrl}
            sx={{
              width: 28,
              height: 28,
              bgcolor: 'primary.main', // Fondo azul
              color: 'white !important', // Texto blanco en avatar con !important
            }}
          >
            {proveedor?.charAt(0)}
          </Avatar>
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {proveedor}
            {isVerified && (
              <Tooltip
                title="Este Proveedor ha sido verificado por Sellsi."
                placement="right"
                arrow
              >
                <VerifiedIcon
                  sx={{ fontSize: 18, color: 'primary.main', ml: 0.5 }}
                />
              </Tooltip>
            )}
          </Box>
        }
        onClick={isLoggedIn ? handleSupplierClick : undefined}
        clickable={isLoggedIn}
        sx={{
          py: 2.5,
          px: 1.5,
          fontSize: '0.95rem',
          fontWeight: 600,
          color: 'primary.main', // Texto azul
          bgcolor: 'white', // Fondo blanco
          border: '2px solid', // Borde azul
          borderColor: 'primary.main',
          borderRadius: '12px',
          cursor: isLoggedIn ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          width: { xs: '100%', md: 'auto' },
          '&:hover': isLoggedIn
            ? {
                bgcolor: 'rgba(46, 82, 178, 0.05)', // Fondo azul muy claro al hover
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(46, 82, 178, 0.2)',
              }
            : {},
          '& .MuiChip-label': {
            px: 1.5,
            fontWeight: 600,
            color: 'primary.main', // Asegurar texto azul
          },
          '& .MuiChip-avatar': {
            ml: 1,
          },
        }}
      />
    </Box>
  );
};

export default ProductSupplier;
