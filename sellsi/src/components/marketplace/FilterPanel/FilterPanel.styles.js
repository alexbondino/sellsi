export const filterPanelStyles = {
  desktop: {
    width: 350, // ✅ CAMBIAR: de 280 a 380px
    bgcolor: 'white',
    borderRadius: 2,
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    p: 3,
    position: 'fixed',
    height: 'fit-content',
    maxHeight: 'calc(100vh - 200px)',
    overflowY: 'auto',
    border: '1px solid #e2e8f0',
    // ✅ RESTAURAR animación solo del panel
    transition:
      'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
    zIndex: 1200,
    top: 180,
    left: 20,
  },

  mobile: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    bgcolor: 'white',
    zIndex: 1300,
    overflowY: 'auto',
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
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#1e293b',
    mb: 3,
  },

  sectionTitle: {
    fontSize: '1rem',
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
