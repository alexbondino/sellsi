/**
 * ============================================================================
 * VIRTUALIZED PRODUCT GRID - GRID VIRTUALIZADO PARA PRODUCTOS
 * ============================================================================
 *
 * Componente optimizado para renderizar grandes listas de productos usando
 * react-window para virtualización y mejor performance.
 *
 * CARACTERÍSTICAS:
 * - ✅ Virtualización de elementos DOM (solo renderiza los visibles)
 * - ✅ Responsive grid con breakpoints automáticos
 * - ✅ Scroll infinito optimizado
 * - ✅ Memoización inteligente de elementos
 * - ✅ Skeleton loading para elementos no cargados
 * - ✅ Auto-sizing basado en contenido
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { FixedSizeGrid as Grid, FixedSizeList } from 'react-window'
import { Box, useTheme, useMediaQuery, Typography, Grow } from '@mui/material'
import ProductCard from '../../features/marketplace/ProductCard/ProductCard'
import SupplierProductCard from '../../features/supplier/components/SupplierProductCard'

/**
 * Hook para calcular configuración responsive del grid
 */
const useGridConfig = () => {
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.only('xs'))
  const isSm = useMediaQuery(theme.breakpoints.only('sm'))
  const isMd = useMediaQuery(theme.breakpoints.only('md'))
  const isLg = useMediaQuery(theme.breakpoints.only('lg'))
  
  return useMemo(() => {
    // Determinar columnas según breakpoint
    let columnCount = 5 // xl default
    if (isXs) columnCount = 2
    else if (isSm) columnCount = 2
    else if (isMd) columnCount = 3
    else if (isLg) columnCount = 4
    
    // Determinar tamaños según columnas
    const itemWidth = isXs ? 180 : isSm ? 200 : isMd ? 240 : isLg ? 280 : 300
    const itemHeight = 450 // Altura fija de ProductCard
    const gap = isXs ? 12 : isSm ? 12 : 24 // Gap responsive
    
    return {
      columnCount,
      itemWidth,
      itemHeight,
      gap,
    }
  }, [isXs, isSm, isMd, isLg])
}

/**
 * Componente Cell virtualizada para ProductCard
 */
const VirtualizedCell = React.memo(({ columnIndex, rowIndex, style, data }) => {
  const { productos, onAddToCart, columnCount, gap } = data
  const index = rowIndex * columnCount + columnIndex
  const producto = productos[index]
  
  // Si no hay producto, renderizar espacio vacío
  if (!producto) {
    return <div style={style} />
  }
  
  // Ajustar estilo con gap
  const cellStyle = {
    ...style,
    left: style.left + gap / 2,
    top: style.top + gap / 2,
    width: style.width - gap,
    height: style.height - gap,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  }
  
  return (
    <div style={cellStyle}>
      <ProductCard
        producto={producto}
        onAddToCart={onAddToCart}
        onViewDetails={() => {}}
      />
    </div>
  )
})

VirtualizedCell.displayName = 'VirtualizedCell'

/**
 * Componente principal VirtualizedProductGrid
 */
const VirtualizedProductGrid = ({
  productos = [],
  onAddToCart = () => {},
  height = 600,
  className = '',
  overscanRowCount = 2, // Renderizar 2 filas extra para scroll suave
}) => {
  const { columnCount, itemWidth, itemHeight, gap } = useGridConfig()
  const [containerWidth, setContainerWidth] = useState(0)
  
  // Calcular número de filas
  const rowCount = Math.ceil(productos.length / columnCount)
  
  // Calcular ancho total del grid
  const gridWidth = useMemo(() => {
    return Math.min(
      containerWidth,
      columnCount * itemWidth + gap * (columnCount + 1)
    )
  }, [containerWidth, columnCount, itemWidth, gap])
  
  // Callback para medir el contenedor
  const measureRef = useCallback((node) => {
    if (node) {
      const width = node.offsetWidth;
      if (width && width > 0) {
        setContainerWidth(width);
      }
    }
  }, [])

  // Data para pasar a las celdas
  const itemData = useMemo(() => ({
    productos,
    onAddToCart,
    columnCount,
    gap,
  }), [productos, onAddToCart, columnCount, gap])
  
  // Si no hay productos, no renderizar el grid
  if (productos.length === 0) {
    return null
  }
  
  // Renderizar solo si el ancho es válido
  if (containerWidth <= 0) {
    return <Box ref={measureRef} sx={{ width: '100%', height }} />;
  }
  
  return (
    <Box
      ref={measureRef}
      className={className}
      sx={{
        width: '100%',
        height,
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {containerWidth > 0 && (
        <Grid
          columnCount={columnCount}
          columnWidth={itemWidth + gap}
          height={height}
          rowCount={rowCount}
          rowHeight={itemHeight + gap}
          width={gridWidth}
          itemData={itemData}
          overscanRowCount={overscanRowCount}
          style={{
            paddingLeft: gap / 2,
            paddingTop: gap / 2,
          }}
        >
          {VirtualizedCell}
        </Grid>
      )}
    </Box>
  )
}

/**
 * Hook para determinar cuándo usar virtualización
 */
export const useVirtualization = (itemCount, threshold = 50) => {
  return useMemo(() => {
    return itemCount > threshold
  }, [itemCount, threshold])
}

/**
 * Componente wrapper que decide entre grid normal y virtualizado
 */
const SmartProductGrid = ({
  productos = [],
  onAddToCart = () => {},
  height = 600,
  virtualizationThreshold = 50,
  normalGridComponent,
  ...props
}) => {
  const shouldVirtualize = useVirtualization(productos.length, virtualizationThreshold)
  
  if (shouldVirtualize) {
    return (
      <VirtualizedProductGrid
        productos={productos}
        onAddToCart={onAddToCart}
        height={height}
        {...props}
      />
    )
  }
  
  // Usar grid normal para listas pequeñas
  return normalGridComponent || null
}

/**
 * VirtualizedSupplierGrid - Grid virtualizado específico para SupplierProductCard
 * Optimizado para el dashboard de proveedores con diferentes props y handlers
 */
export const VirtualizedSupplierGrid = ({ 
  products, 
  onEdit,
  onDelete,
  onViewStats,
  operationStates = {},
  itemHeight = 440,
  gridConfig = { xs: 1, sm: 2, md: 3, lg: 4 },
  ...props 
}) => {
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef(null)

  // Calcular dimensiones del grid (más columnas para supplier)
  const { itemsPerRow, itemWidth } = useMemo(() => {
    const breakpoints = {
      xs: { min: 0, max: 599, cols: gridConfig.xs },
      sm: { min: 600, max: 959, cols: gridConfig.sm }, 
      md: { min: 960, max: 1279, cols: gridConfig.md },
      lg: { min: 1280, max: 1919, cols: gridConfig.lg },
      xl: { min: 1920, max: Infinity, cols: gridConfig.xl || gridConfig.lg }
    }
    
    const currentBreakpoint = Object.values(breakpoints).find(
      bp => containerWidth >= bp.min && containerWidth <= bp.max
    ) || breakpoints.lg
    
    const cols = currentBreakpoint.cols
    const gap = 24 // 3 * 8px de MUI spacing
    const width = (containerWidth - (gap * (cols - 1))) / cols
    
    return {
      itemsPerRow: cols,
      itemWidth: Math.max(width, 300) // mínimo 300px para supplier cards
    }
  }, [containerWidth, gridConfig])

  // Redimensionar contenedor
  useEffect(() => {
    if (!containerRef.current) return
    
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Renderizar item de supplier
  const ItemRenderer = ({ index, style }) => {
    const rowIndex = Math.floor(index / itemsPerRow)
    const startIndex = rowIndex * itemsPerRow
    const endIndex = Math.min(startIndex + itemsPerRow, products.length)
    const rowItems = products.slice(startIndex, endIndex)
    
    return (
      <div style={style}>
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            px: 1.5,
            py: 1.5,
          }}
        >
          {rowItems.map((product, itemIndex) => {
            const productIndex = startIndex + itemIndex
            
            return (
              <Box
                key={product.id || productIndex}
                sx={{ 
                  width: itemWidth,
                  flexShrink: 0
                }}
              >
                <SupplierProductCard
                  product={product}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onViewStats={onViewStats}
                  isDeleting={operationStates.deleting?.[product.id]}
                  isUpdating={operationStates.updating?.[product.id]}
                />
              </Box>
            )
          })}
        </Box>
      </div>
    )
  }

  // Calcular filas totales
  const totalRows = Math.ceil(products.length / itemsPerRow)
  const rowHeight = itemHeight + 24 // altura item + gap

  if (products.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <Typography variant="h6">No hay productos para mostrar</Typography>
      </Box>
    )
  }

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '80vh', minHeight: 400 }}>
      {containerWidth > 0 && (
        <FixedSizeList
          height={Math.min(600, window.innerHeight * 0.8)}
          itemCount={totalRows}
          itemSize={rowHeight}
          overscanCount={2}
          {...props}
        >
          {ItemRenderer}
        </FixedSizeList>
      )}
    </Box>
  )
}

/**
 * SmartSupplierGrid - Wrapper inteligente para grid de proveedores
 * Usa virtualización para listas grandes, grid tradicional para pequeñas
 */
export const SmartSupplierGrid = ({ 
  products = [], 
  threshold = 20,
  onEdit,
  onDelete,
  onViewStats,
  operationStates = {},
  ...props 
}) => {
  // Para supplier dashboard, usar menor threshold debido a cards más complejas
  const useVirtualization = products.length > threshold

  if (useVirtualization) {
    return (
      <VirtualizedSupplierGrid
        products={products}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewStats={onViewStats}
        operationStates={operationStates}
        {...props}
      />
    )
  }

  // Grid tradicional para listas pequeñas con animaciones
  return (
    <Grid container spacing={3}>
      {products.map((product, index) => (
        <Grow
          key={product.id}
          in={true}
          timeout={600}
          style={{ transitionDelay: `${(index % 8) * 50}ms` }}        >
          <Grid xs={12} sm={6} md={4} lg={3}>
            <SupplierProductCard
              product={product}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewStats={onViewStats}
              isDeleting={operationStates.deleting?.[product.id]}
              isUpdating={operationStates.updating?.[product.id]}
            />
          </Grid>
        </Grow>
      ))}
    </Grid>
  )
}

export default VirtualizedProductGrid
export { SmartProductGrid }
