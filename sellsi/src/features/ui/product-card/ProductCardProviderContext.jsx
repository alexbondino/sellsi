// src/components/ProductCard/ProductCardProviderContext.jsx
import React from 'react';
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

    // Provider destructuring - solo datos del proveedor
    const {
      user_id,
      logo_url,
      user_name,
      supplier_name,
    } = product;

    // Texto mock para todas las cards
    const mockDescription = "Venta mayorista de alimentos saludables: frutos secos, cereales, snacks sin azúcar, productos naturales y sin gluten. Atención rápida a negocios, tiendas, empresas y almacenes en todo Chile. Vengan xd";
    
    // Nombre del proveedor (priorizar user_name sobre supplier_name)
    const providerName = user_name || supplier_name;

    return (
      <>
        <CardContent sx={{ 
          p: { xs: 1, sm: 1.5 }, 
          pb: '8px !important',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}>
          {/* Provider Logo */}
          {logo_url && (
            <Box sx={{ mb: 2 }}>
              <Avatar
                src={logo_url}
                alt={providerName}
                sx={{
                  width: { xs: 60, sm: 70, md: 80 },
                  height: { xs: 60, sm: 70, md: 80 },
                  border: theme => `2px solid ${theme.palette.primary.main}`,
                }}
              />
            </Box>
          )}

          {/* Provider Name */}
          {providerName && (
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                fontWeight: 600,
                lineHeight: 1.2,
                mb: 1.5,
                color: 'primary.main',
              }}
            >
              {providerName}
            </Typography>
          )}

          {/* Mock Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              textAlign: 'justify',
            }}
          >
            {mockDescription}
          </Typography>
        </CardContent>

        <CardActions 
          sx={{ 
            p: { xs: 1, sm: 1.5 }, 
            pt: 0,
            justifyContent: 'center',
          }}
        >
          {/* Review Catalog Button */}
          <Button
            variant="contained"
            startIcon={<VisibilityIcon />}
            size="small"
            fullWidth
            data-no-card-click="true"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
              py: 0.8,
              maxWidth: '200px',
            }}
          >
            Revisar Catálogo
          </Button>
        </CardActions>
      </>
    );
  }
);

ProductCardProviderContext.displayName = 'ProductCardProviderContext';

export default ProductCardProviderContext;
