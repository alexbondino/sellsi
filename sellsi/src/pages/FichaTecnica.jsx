import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Paper,
  Breadcrumbs,
  Link,
} from '@mui/material'
import { ArrowBack, Home, StorefrontOutlined } from '@mui/icons-material'
import ProductPageView from '../components/marketplace/ProductPageView/ProductPageView'
import { PRODUCTOS } from '../data/marketplace/products'

const FichaTecnica = () => {
  const { productSlug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Extraer el ID del producto del slug
    // El slug tiene formato: nombredelproducto-ID
    if (productSlug) {
      const slugParts = productSlug.split('-')
      const productId = slugParts[slugParts.length - 1]

      // Buscar el producto por ID
      const foundProduct = PRODUCTOS.find((p) => p.id.toString() === productId)

      if (foundProduct) {
        setProduct(foundProduct)
      } else {
        // Si no se encuentra el producto, redirigir al marketplace
        navigate('/buyer/marketplace', { replace: true })
      }
    }
    setLoading(false)
  }, [productSlug, navigate])
  const handleClose = () => {
    navigate('/buyer/marketplace')
  }
  const handleAddToCart = (product) => {
    const supplierid = localStorage.getItem('supplierid')
    const sellerid = localStorage.getItem('sellerid')
    const isLoggedIn = !!(supplierid || sellerid)

    if (!isLoggedIn) {
      // Disparar evento para abrir Login modal
      const event = new CustomEvent('openLoginModal')
      window.dispatchEvent(event)
    } else {
      // Lógica para agregar al carrito (usuario logueado)
      console.log('Producto agregado al carrito:', product.nombre)
    }
  }

  const handleBuyNow = (product) => {
    const supplierid = localStorage.getItem('supplierid')
    const sellerid = localStorage.getItem('sellerid')
    const isLoggedIn = !!(supplierid || sellerid)

    if (!isLoggedIn) {
      // Disparar evento para abrir Login modal
      const event = new CustomEvent('openLoginModal')
      window.dispatchEvent(event)
    } else {
      // Lógica para comprar ahora (usuario logueado)
      console.log('Comprar ahora:', product.nombre)
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Cargando...
        </Typography>
      </Box>
    )
  }

  if (!product) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Producto no encontrado
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            El producto que buscas no existe o ha sido removido.
          </Typography>{' '}
          <Button
            variant="contained"
            startIcon={<StorefrontOutlined />}
            onClick={() => navigate('/buyer/marketplace')}
          >
            Volver al Marketplace
          </Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header with navigation */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          py: 2,
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            {/* Back button */}
            <Button
              startIcon={<ArrowBack />}
              onClick={handleClose}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              Volver al Marketplace
            </Button>
          </Box>

          {/* Breadcrumbs */}
          <Breadcrumbs
            sx={{
              fontSize: '0.875rem',
              color: 'text.secondary',
            }}
          >
            <Link
              underline="hover"
              color="inherit"
              onClick={() => navigate('/')}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Home fontSize="small" />
              Inicio
            </Link>{' '}
            <Link
              underline="hover"
              color="inherit"
              onClick={() => navigate('/buyer/marketplace')}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <StorefrontOutlined fontSize="small" />
              Marketplace
            </Link>
            <Typography color="primary" sx={{ fontWeight: 600 }}>
              {product.nombre}
            </Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      {/* Product Page View */}
      <Box sx={{ pt: 0 }}>
        <ProductPageView
          product={product}
          onClose={handleClose}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          isOpen={true}
          isPageView={true} // Flag para indicar que es una vista de página completa
        />
      </Box>
    </Box>
  )
}

export default FichaTecnica
