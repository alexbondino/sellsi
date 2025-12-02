import React from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Typography } from '@mui/material';

/**
 * Pagination component for buyer orders list.
 * Displays page navigation with ellipsis for large page counts.
 * Extracted from BuyerOrders.jsx for reusability.
 */
const OrdersPagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (!totalItems || totalItems <= itemsPerPage) return null;

  const showPages = 5; // Similar to Marketplace pagination
  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
  let endPage = Math.min(totalPages, startPage + showPages - 1);
  if (endPage - startPage < showPages - 1) {
    startPage = Math.max(1, endPage - showPages + 1);
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
        py: 2,
        flexWrap: 'wrap'
      }}
    >
      <Button
        variant="outlined"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        sx={{ minWidth: 'auto', px: 2, fontSize: '0.875rem' }}
      >
        ‹ Anterior
      </Button>

      {startPage > 1 && (
        <>
          <Button
            variant={1 === currentPage ? 'contained' : 'outlined'}
            onClick={() => onPageChange(1)}
            sx={{ minWidth: 40 }}
          >
            1
          </Button>
          {startPage > 2 && <Typography variant="body2">...</Typography>}
        </>
      )}

      {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? 'contained' : 'outlined'}
          onClick={() => onPageChange(page)}
          sx={{ minWidth: 40, fontSize: '0.875rem' }}
        >
          {page}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <Typography variant="body2">...</Typography>
          )}
          <Button
            variant={totalPages === currentPage ? 'contained' : 'outlined'}
            onClick={() => onPageChange(totalPages)}
            sx={{ minWidth: 40 }}
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outlined"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        sx={{ minWidth: 'auto', px: 2, fontSize: '0.875rem' }}
      >
        Siguiente ›
      </Button>

      <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
        Página {currentPage} de {totalPages}
      </Typography>
    </Box>
  );
};

OrdersPagination.propTypes = {
  totalItems: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default OrdersPagination;
