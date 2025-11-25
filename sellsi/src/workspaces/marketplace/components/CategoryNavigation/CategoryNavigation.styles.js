export const categoryNavigationStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flexWrap: 'wrap',
  },

  categoriesButton: {
    fontWeight: 700,
    color: '#1e293b',
    textTransform: 'none',
    fontSize: '1rem',
    '&:hover': {
      bgcolor: 'rgba(30, 41, 59, 0.04)',
    },
  },

  categoriesMenu: {
    maxHeight: 400,
    width: 280,
    mt: 1,
  },

  menuItem: (isSelected) => ({
    fontSize: '0.9rem',
    py: 1.5,
    ...(isSelected && {
      bgcolor: '#e0f2fe',
      fontWeight: 600,
      color: 'primary.main',
    }),
    '&:hover': {
      bgcolor: 'rgba(25, 118, 210, 0.1)',
    },
  }),

  selectedIndicator: {
    ml: 'auto',
    width: 8,
    height: 8,
    borderRadius: '50%',
    bgcolor: 'primary.main',
  },

  sectionButton: (isActive) => ({
    fontWeight: isActive ? 700 : 500,
    color: isActive ? 'primary.main' : '#64748b',
    textTransform: 'none',
    fontSize: '0.95rem',
    minWidth: 'auto',
    px: 2,
    py: 1,
    borderRadius: 2,
    position: 'relative',
    outline: 'none',
    '&:focus': {
      outline: 'none',
    },
    '&:hover': {
      bgcolor: 'rgba(25, 118, 210, 0.08)',
      color: 'primary.main',
    },
    ...(isActive && {
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        height: 2,
        bgcolor: 'primary.main',
        borderRadius: 1,
      },
    }),
  }),

  categoryChip: {
    fontSize: '0.75rem',
  },

  moreCategories: {
    color: 'text.secondary',
  },
}
