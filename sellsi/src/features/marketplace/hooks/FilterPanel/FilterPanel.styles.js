export const filterPanelStyles = {
  desktop: {
    width: 350,
    bgcolor: 'white',
    borderRadius: 2,
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    p: 3,
    border: '1px solid #e2e8f0',
    // Eliminar position, top, left, zIndex, maxHeight, overflowY, transform y transition aquí
    // para que los estilos inline del componente tengan prioridad
    '&::-webkit-scrollbar': {
      width: 6,
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f5f9',
      borderRadius: 3,
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#cbd5e1',
      borderRadius: 3,
      '&:hover': {
        background: '#94a3b8',
      },
    },
  },
  mobile: {
    bgcolor: 'white',
    overflowY: 'auto',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
    // Tamaño más pequeño en mobile
    width: '95vw',
    maxWidth: 320,
    minWidth: 0,
    // Eliminar zIndex, transform y transition aquí
  },

  mobileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    p: 2,
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    bgcolor: 'white',
    zIndex: 1,
  },

  mobileContent: {
    p: 3,
  },

  mobileFooter: {
    p: 2,
    borderTop: '1px solid #e2e8f0',
    position: 'sticky',
    bottom: 0,
    bgcolor: 'white',
    display: 'flex',
    gap: 2,
  },

  title: {
    fontSize: { xs: '1.05rem', sm: '1.1rem', md: '1.25rem' },
    fontWeight: 700,
    color: '#1e293b',
    mb: 3,
  },

  sectionTitle: {
    fontSize: { xs: '0.95rem', sm: '1rem', md: '1.05rem' },
    fontWeight: 600,
    color: '#334155',
    mb: 2,
    mt: 3,
  },

  filterGroup: {
    mb: 3,
    pb: 2,
    borderBottom: '1px solid #f1f5f9',
    '&:last-child': {
      borderBottom: 'none',
      mb: 0,
    },
  },

  clearButton: {
    color: '#ef4444',
    textTransform: 'none',
    fontWeight: 600,
    p: 0,
    minWidth: 'auto',
    '&:hover': {
      bgcolor: 'rgba(239, 68, 68, 0.04)',
    },
  },
  applyButton: {
    borderRadius: 2,
    fontWeight: 600,
    textTransform: 'none',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
    },
  },

  input: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1.5,
    },
  },

  slider: {
    '& .MuiSlider-thumb': {
      width: 20,
      height: 20,
    },
    '& .MuiSlider-track': {
      height: 6,
    },
    '& .MuiSlider-rail': {
      height: 6,
    },
  },
}
