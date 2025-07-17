// src/components/ProductCard/ProductCardProviderContext.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Avatar,
} from '@mui/material';
import {
  Handshake as HandshakeIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

/**
 * ProductCardProviderContext - Renders the specific content and actions for a provider's product card.
 * This component is an internal part of the main ProductCard.
 * Shows only provider information: logo, name, and description.
 */
const ProductCardProviderContext = React.memo(
  ({ product }) => {
    const navigate = useNavigate();
    // Desestructurar fuera del bloque comentado
    const { supplier_id, user_nm, proveedor, logo_url, product_count, descripcion_proveedor } = product || {};

    // Memoizar nombre del proveedor - usar datos reales
    const providerName = React.useMemo(() => 
      user_nm || proveedor || `Proveedor #${supplier_id}`,
      [user_nm, proveedor, supplier_id]
    );

    return (
      <>
        {/* Provider Logo Container - Mismo tamaño que el contenedor de imagen de ProductCard */}
        <Box sx={{
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          height: { xs: 142, sm: 154, md: 187.5, lg: 220, xl: 220 },
          boxSizing: 'border-box',
          bgcolor: '#fafafa',
          p: { xs: 1, sm: 1.2, md: 1.5, lg: 0},
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: theme => `1px solid ${theme.palette.primary.main}`,
          overflow: 'hidden',
        }}>
          <Avatar
            src={logo_url}
            alt={providerName}
            variant="square"
            sx={{
              width: '100%',
              height: '100%',
              minWidth: 0,
              minHeight: 0,
              maxWidth: '100%',
              maxHeight: '100%',
              border: theme => `1px solid ${theme.palette.primary.main}`,
              borderRadius: 1,
              overflow: 'hidden',
              objectFit: 'contain',
              objectPosition: 'center',
              boxSizing: 'border-box',
              '& img': {
                objectFit: 'contain !important',
                width: '100% !important',
                height: '100% !important',
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block',
                margin: '0 auto',
              }
            }}
          >
            {/* Fallback: mostrar inicial del nombre si no hay imagen */}
            {!logo_url && providerName ? providerName.charAt(0).toUpperCase() : '🏢'}
          </Avatar>
        </Box>

        <CardContent sx={{ 
          p: { xs: 1, sm: 1.5 }, 
          pb: '8px !important',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}>

          {/* Provider Name */}
          {providerName && (
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.4rem' },
                fontWeight: 600,
                lineHeight: 1.2,
                mb: 1.5,
                color: 'primary.main',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
              }}
            >
              {providerName}
            </Typography>
          )}

          {/* Descripción real del proveedor */}
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
              lineHeight: 1.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: { xs: 8, sm: 7, md: 6, lg: 8 },
              WebkitBoxOrient: 'vertical',
              textAlign: 'justify',
              mb: 0.5,
              color: 'text.primary',
              fontWeight: 400,
            }}
          >
            {descripcion_proveedor && descripcion_proveedor.trim().length > 0
              ? descripcion_proveedor
              : 'Proveedor sin descripción.'}
          </Typography>
        </CardContent>

        <CardActions 
          sx={{ 
            p: { xs: 1, sm: 1.5 }, 
            pt: 0,
            justifyContent: 'center',
          }}
        >
          {/* Review Catalog Button - Idéntico al botón AGREGAR */}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            data-no-card-click="true"
            startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              
              // Determinar la ruta de origen para el estado de navegación
              const currentPath = window.location.pathname;
              let fromPath = '/marketplace';
              
              if (currentPath.includes('/buyer/')) {
                fromPath = '/buyer/marketplace';
              } else if (currentPath.includes('/supplier/')) {
                fromPath = '/supplier/marketplace';
              }
              
              // Navegar al catálogo del proveedor
              // Formato: /catalog/:userNm/:userId
              const userNmSlug = (user_nm || proveedor || `proveedor-${supplier_id}`)
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
              
              const catalogUrl = `/catalog/${userNmSlug}/${supplier_id}`;
              
              // Usar navigate de React Router con estado
              navigate(catalogUrl, {
                state: { from: fromPath }
              });
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              py: 0.8,
              fontSize: '0.9rem',
              color: 'white',
              backgroundColor: 'primary.main',
              boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 10,
              '&:hover': {
                backgroundColor: 'primary.dark',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.6)',
                transform: 'translateY(-2px)',
                border: 'none',
              },
              '&:active': {
                border: 'none !important',
                outline: 'none !important',
              },
              '&:focus': {
                border: 'none !important',
                outline: 'none !important',
              },
              '& .MuiButton-startIcon': {
                marginRight: 1,
              },
            }}
          >
            REVISAR CATÁLOGO
          </Button>
        </CardActions>
      </>
    );
  }
);

// ✅ OPTIMIZACIÓN: Función de comparación personalizada para React.memo
const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.product.supplier_id === nextProps.product.supplier_id &&
    prevProps.product.logo_url === nextProps.product.logo_url &&
    prevProps.product.user_nm === nextProps.product.user_nm &&
    prevProps.product.proveedor === nextProps.product.proveedor &&
    prevProps.product.descripcion_proveedor === nextProps.product.descripcion_proveedor &&
    prevProps.product.product_count === nextProps.product.product_count
  );
};

ProductCardProviderContext.displayName = 'ProductCardProviderContext';

export default React.memo(ProductCardProviderContext, areEqual);
