// 📁 pages/ProviderHome.jsx
import React from 'react'
import { Box, Grid, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useSupplierDashboard } from '../../hooks/useSupplierDashboard'
import DashboardSummary from '../../components/DashboardSummary'
import RequestList from '../../components/RequestList'
import MonthlySalesChart from '../../components/BarChart'
import SidebarProvider from '../../components/SideBar'

const ProviderHome = () => {
  const supplierId = localStorage.getItem('supplierid')
  const {
    products,
    sales,
    productStocks,
    weeklyRequests,
    monthlyData,
    totalSales,
  } = useSupplierDashboard(supplierId)

  const productsOutOfStock = productStocks.filter(
    (p) => p.productqty === 0
  ).length

  return (
    <>
      <SidebarProvider />

      {/* Este Box es el contenido principal, desplazado a la derecha */}
      <Box
        sx={{
          marginLeft: '250px', // debe coincidir con el ancho del sidebar
          padding: 2,
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
          {/* Columna izquierda */}
          <Box sx={{ flex: 2, p: 2 }}>
            <DashboardSummary
              products={products}
              totalSales={totalSales}
              outOfStock={productsOutOfStock}
              weeklyRequests={weeklyRequests}
            />

            <Grid item xs={12} container justifyContent="center" sx={{ mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                fullWidth
                sx={{ py: 3, borderRadius: 2, fontSize: 25 }}
              >
                Nuevo Producto
              </Button>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <MonthlySalesChart data={monthlyData} />
            </Box>
          </Box>

          {/* Columna derecha */}
          <Box sx={{ flexShrink: 0, width: 350, p: 2 }}>
            <RequestList weeklyRequests={weeklyRequests} />
          </Box>
        </Box>
      </Box>
    </>
  )
}

export default ProviderHome
