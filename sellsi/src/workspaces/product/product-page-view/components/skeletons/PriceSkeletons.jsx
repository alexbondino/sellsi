import React from 'react'
import { Box, Skeleton, Table, TableBody, TableCell, TableContainer, TableRow, Paper } from '@mui/material'

export const PriceTiersSkeleton = ({ rows = 4 }) => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1, mb: 1 }}>
      <Skeleton variant="text" width={160} height={28} />
      <Skeleton variant="circular" width={20} height={20} />
      <Skeleton variant="circular" width={20} height={20} />
    </Box>
    <TableContainer component={Paper} sx={{ maxWidth: 400, width: 'fit-content' }}>
      <Table size="small">
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell align="center"><Skeleton variant="text" width={90} height={20} /></TableCell>
              <TableCell align="center"><Skeleton variant="text" width={110} height={20} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
)

export const SinglePriceSkeleton = () => (
  <Box sx={{ mb: 3 }}>
    <Skeleton variant="text" width={90} height={28} sx={{ mb: 1 }} />
    <TableContainer component={Paper} sx={{ maxWidth: 400, width: 'fit-content' }}>
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell align="center"><Skeleton variant="text" width={70} height={20} /></TableCell>
            <TableCell align="center"><Skeleton variant="text" width={110} height={20} /></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
)
