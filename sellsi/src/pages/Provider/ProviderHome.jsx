import React, { useEffect, useState } from 'react'
import { Box, Typography, Button, Grid, Paper } from '@mui/material'
import { supabase } from '../../services/supabase'
import PaidIcon from '@mui/icons-material/Paid'
import InventoryIcon from '@mui/icons-material/Inventory'
import WarningIcon from '@mui/icons-material/Warning'
import AddIcon from '@mui/icons-material/Add'
import ListAltIcon from '@mui/icons-material/ListAlt'

const supplierId = '00000000-0000-0000-0000-000000000001'

const ProviderHome = () => {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [productQty, setProductQty] = useState([])
  const [weeklyRequests, setWeeklyRequests] = useState([])

  const getStartOfWeek = () => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(now.setDate(diff)).toISOString().split('T')[0]
  }

  const getEndOfWeek = () => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + 7
    const endOfWeek = new Date(now.setDate(diff))
    return endOfWeek.toISOString().split('T')[0]
  }

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('supplierid', supplierId)

      if (error) {
        console.error('❌ Error al obtener productos:', error)
      } else {
        setProducts(data)
        setProductQty(data.map((p) => ({ productqty: p.productqty })))
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    const fetchSales = async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('amount')
        .eq('supplierid', supplierId)

      if (error) {
        console.error('❌ Error al obtener ventas:', error)
      } else {
        setSales(data)
      }
    }

    fetchSales()
  }, [])

  useEffect(() => {
    const fetchRequests = async () => {
      const startOfWeek = getStartOfWeek()
      const endOfWeek = getEndOfWeek()

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('productid')
        .eq('supplierid', supplierId)

      if (productError) {
        console.error(
          '❌ Error al obtener productos del proveedor:',
          productError
        )
        return
      }

      const productIds = productData.map((p) => p.productid)

      if (productIds.length === 0) {
        setWeeklyRequests([])
        return
      }

      const { data: requests, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .in('productid', productIds)
        .gte('createddt', startOfWeek)
        .lte('createddt', endOfWeek)

      if (requestError) {
        console.error('❌ Error al obtener requests:', requestError)
      } else {
        setWeeklyRequests(requests)
      }
    }

    fetchRequests()
  }, [])

  const totalSales = sales.reduce((acc, item) => acc + Number(item.amount), 0)
  const totalBreaks = productQty.filter((p) => p.productqty === 0).length

  const cardStyle = {
    p: 2,
    height: '270px',
    width: '270px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  }

  return (
    <Box
      sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, p: 2 }}
    >
      {/* Columna izquierda */}
      <Box sx={{ flex: 2, p: 2, backgroundColor: '#f5f5f5' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={6}>
            <Paper sx={cardStyle}>
              <InventoryIcon sx={{ fontSize: 80, color: 'blue' }} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Productos activos
              </Typography>
              <Typography variant="h1" sx={{ mt: 0 }}>
                {products.length}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <Paper sx={cardStyle}>
              <PaidIcon sx={{ fontSize: 80, color: 'green' }} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Ventas este mes
              </Typography>
              <Typography variant="h1">
                ${totalSales.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <Paper sx={cardStyle}>
              <WarningIcon sx={{ fontSize: 80, color: 'red' }} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Productos sin stock
              </Typography>
              <Typography variant="h1">{totalBreaks}</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <Paper sx={cardStyle}>
              <ListAltIcon sx={{ fontSize: 80, color: 'blue' }} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Solicitudes esta semana
              </Typography>
              <Typography variant="h1">{weeklyRequests.length}</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Grid item xs={12} container justifyContent="center" sx={{ mt: 4 }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<AddIcon />}
            fullWidth
            sx={{
              py: 3,
              backgroundColor: 'white',
              borderRadius: 3,
              fontSize: 25,
            }} // Aumenta la altura del botón
          >
            Nuevo Producto
          </Button>
        </Grid>
      </Box>

      {/* Columna derecha */}
      <Box sx={{ flex: 1, p: 2, backgroundColor: '#f5f5f5' }}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}
          >
            Solicitudes Recientes
          </Typography>
          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {weeklyRequests.length === 0 ? (
              <Typography variant="body2" align="center" color="text.secondary">
                No hay solicitudes esta semana.
              </Typography>
            ) : (
              weeklyRequests.map((req, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: index === 0 ? '1px solid #ddd' : 'none',
                    borderBottom: '1px solid #ddd',
                    py: 1,
                    px: 1.5,
                  }}
                >
                  <Typography fontWeight="bold">
                    {req.quantity} x {req.productname || 'Producto'}
                  </Typography>
                  <Box textAlign="right">
                    <Typography fontWeight="bold">
                      {req.client || 'Cliente'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hace {req.minutesAgo || '5'} min
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default ProviderHome
