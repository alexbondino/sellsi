import React from 'react'
import { Box, Paper, Skeleton, Card, CardContent } from '@mui/material'
import PropTypes from 'prop-types'

/**
 * TableSkeleton - Skeleton de carga para tablas y cards
 *
 * @param {number} rows - Número de filas/cards a mostrar
 * @param {number} columns - Número de columnas (solo para variant='table')
 * @param {boolean} withAvatar - Mostrar avatar/thumbnail
 * @param {boolean} noHeader - Ocultar header (filtros, etc)
 * @param {string} variant - 'table' o 'card'
 */
const TableSkeleton = ({
  rows = 6,
  columns = 5,
  withAvatar = false,
  noHeader = false,
  variant = 'table',
}) => {
  // Skeleton para cards mobile
  if (variant === 'card') {
    return (
      <Box>
        {!noHeader && (
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: 1 }} />
          </Box>
        )}
        {Array.from({ length: rows }).map((_, idx) => (
          <Card key={idx} sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent>
              {/* Avatar + Info principal */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Skeleton variant="rounded" width={60} height={60} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="80%" height={24} />
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width="40%" height={20} />
                </Box>
              </Box>

              {/* Divider */}
              <Skeleton variant="rectangular" height={1} sx={{ my: 1.5 }} />

              {/* Footer: Tiempo + Estado */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Skeleton variant="text" width={60} height={20} />
                <Skeleton variant="rounded" width={80} height={24} />
              </Box>

              {/* Acciones */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Skeleton variant="rounded" height={44} />
                <Skeleton variant="rounded" height={44} />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    )
  }

  // Skeleton para tabla desktop (original)
  const colArray = Array.from({ length: columns })
  return (
    <Paper sx={{ p: 0 }}>
      {!noHeader && (
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Skeleton variant="text" width={140} height={28} />
          <Skeleton variant="rounded" width={180} height={38} />
        </Box>
      )}
      {Array.from({ length: rows }).map((_, r) => (
        <Box
          key={r}
          sx={{
            display: 'flex',
            px: 2,
            py: 1.5,
            alignItems: 'center',
            borderTop: r === 0 ? '1px solid rgba(0,0,0,0.08)' : 'none',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          {withAvatar && (
            <Skeleton variant="rounded" width={72} height={72} sx={{ mr: 2 }} />
          )}
          {colArray.map((__, c) => (
            <Skeleton
              key={c}
              variant="text"
              width={c === colArray.length - 1 ? 110 : 160 - ((c * 7) % 40)}
              height={24}
              sx={{ mr: 3, flexShrink: 0 }}
            />
          ))}
        </Box>
      ))}
    </Paper>
  )
}

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
  withAvatar: PropTypes.bool,
  noHeader: PropTypes.bool,
  variant: PropTypes.oneOf(['table', 'card']),
}

export default TableSkeleton
