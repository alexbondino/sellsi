import React from 'react'
import { Box, Paper, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, TableContainer } from '@mui/material'

export const ProductShippingSkeleton = ({ rows = 5 }) => (
  <Box sx={{ px: { xs: 0, md: 0 }, mt: { xs: 4, md: 6 }, mb: 6, width: '100%' }}>
    <Paper elevation={2} sx={{ p: { xs: 1, md: 5 }, borderRadius: 3, width: { xs: '100%', md: '70%' }, maxWidth: '900px', mx: 'auto' }}>
      <Skeleton variant="text" width={180} height={44} sx={{ mx: 'auto', mb: 2 }} />
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.300', borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><Skeleton variant="text" width={60} /></TableCell>
              <TableCell><Skeleton variant="text" width={60} /></TableCell>
              <TableCell><Skeleton variant="text" width={90} /></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="text" width={70} /></TableCell>
                <TableCell><Skeleton variant="text" width={100} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Skeleton variant="text" width={260} height={20} sx={{ mt: 3, mx: 'auto' }} />
    </Paper>
  </Box>
)

export default ProductShippingSkeleton
