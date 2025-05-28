export const productCardStyles = {
  card: {
    maxWidth: 345,
    mx: 'auto',
    borderRadius: 3,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
    },
  },
  
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '2px 6px',
    borderRadius: 1,
    fontSize: '0.75rem',
    fontWeight: 600,
    zIndex: 2,
  },
  
  stockBadge: (inStock) => ({
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: inStock ? '#4caf50' : '#f44336',
    color: 'white',
    padding: '2px 6px',
    borderRadius: 1,
    fontSize: '0.65rem',
    fontWeight: 500,
    zIndex: 2,
  }),
  
  imageContainer: {
    position: 'relative',
    height: 200,
    overflow: 'hidden',
  },
  
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  },
  
  content: {
    p: 2,
  },
  
  title: {
    fontSize: '1rem',
    fontWeight: 600,
    mb: 1,
    color: '#1e293b',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  
  priceContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 1,
  },
  
  currentPrice: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#1976d2',
  },
  
  originalPrice: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    textDecoration: 'line-through',
  },
  
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    mb: 1,
  },
  
  ratingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
  },
  
  commission: {
    color: '#059669',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  
  salesInfo: {
    color: '#64748b',
    fontSize: '0.75rem',
  },
  
  actionButton: {
    mt: 1,
    borderRadius: 2,
    fontWeight: 600,
    textTransform: 'none',
  },
}