/**
 * productPageStyles.js - Constantes de estilos para ProductPageView
 *
 * Centraliza todos los valores hardcoded de estilos para:
 * - Mantener consistencia visual
 * - Facilitar cambios globales
 * - Reducir duplicación de código
 */

// =============================================================================
// COLORES
// =============================================================================
export const COLORS = {
  // Colores principales
  primary: '#2E52B2', // MUI primary default
  primaryLight: '#42a5f5',
  primaryDark: '#1565c0',

  // Colores de estado
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',

  // Grises y neutros
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  background: '#FAFAFA',
  backgroundHover: '#F5F5F5',

  // Texto
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',

  // Chips
  chipBackground: '#EEF2FF',
  chipText: '#2E52B2',

  // Botones hover
  buttonHoverBg: 'rgba(25, 118, 210, 0.04)',
};

// =============================================================================
// ESPACIADO
// =============================================================================
export const SPACING = {
  // Padding/margin estándar (valores MUI theme spacing)
  xs: 0.5, // 4px
  sm: 1, // 8px
  md: 2, // 16px
  lg: 3, // 24px
  xl: 4, // 32px
  xxl: 6, // 48px

  // Específicos del layout
  pageGutter: 3,
  mobileGutter: 0.75,
  sectionGap: 4,
  componentGap: 2,
};

// =============================================================================
// BREAKPOINTS Y DIMENSIONES
// =============================================================================
export const DIMENSIONS = {
  // Anchos máximos
  maxContentWidth: 1450,
  maxHeaderWidth: '41%',
  maxTableWidth: '77.5%',

  // Alturas
  galleryHeight: 400,
  galleryHeightMobile: 300,
  thumbnailSize: 60,

  // Avatares
  avatarSm: 32,
  avatarMd: 40,
  avatarLg: 56,

  // Border radius
  borderRadiusSm: 1,
  borderRadiusMd: 2,
  borderRadiusLg: 3,
};

// =============================================================================
// ESTILOS DE COMPONENTES
// =============================================================================

/**
 * Estilos del contenedor principal del header
 */
export const HEADER_STYLES = {
  container: {
    width: '100%',
    maxWidth: '100%',
  },

  flexContainer: {
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    width: '100%',
    gap: { xs: 2, md: 0 },
    ml: { xs: 0, md: 2 },
  },

  section: {
    mb: SPACING.md,
    pb: SPACING.md,
    borderBottom: `1px solid ${COLORS.borderLight}`,
    '&:last-child': {
      borderBottom: 'none',
      mb: 0,
      pb: 0,
    },
  },
};

/**
 * Estilos de tipografía
 */
export const TYPOGRAPHY_STYLES = {
  productTitle: {
    fontWeight: 700,
    color: 'primary.main',
    lineHeight: 1.2,
  },

  productTitleDesktop: {
    fontWeight: 700,
    color: 'primary.main',
    lineHeight: 1.2,
    px: 0,
    py: 1,
    fontSize: {
      md: '1.5rem',
      lg: '1.7rem',
      xl: '2rem',
    },
    wordBreak: 'break-word',
    hyphens: 'auto',
  },

  productTitleMobile: {
    fontWeight: 700,
    color: 'primary.main',
    lineHeight: 1.2,
    mt: 4,
    fontSize: '1.25rem',
    wordBreak: 'break-word',
    hyphens: 'auto',
    textAlign: 'center',
    width: '100%',
  },

  sectionTitle: {
    fontWeight: 600,
    fontSize: '1.1rem',
    color: COLORS.textPrimary,
    mb: SPACING.sm,
  },

  label: {
    fontWeight: 500,
    fontSize: '0.875rem',
    color: COLORS.textSecondary,
    mb: SPACING.xs,
  },
};

/**
 * Estilos de precios
 */
export const PRICING_STYLES = {
  container: {
    mb: 3,
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: { xs: 'center', md: 'flex-start' }, // Centrado en mobile, izquierda en desktop
    gap: 1,
    mb: 1,
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    mb: 1,
    width: '100%',
  },

  title: {
    color: 'text.primary',
  },

  tableContainer: {
    maxWidth: { xs: '100%', md: DIMENSIONS.maxTableWidth }, // ✅ Full width en mobile
    mx: { xs: 'auto', md: 0 }, // Centrado en mobile, alineado a la izquierda en desktop
    mb: 2,
  },

  tableContainerLeft: {
    maxWidth: DIMENSIONS.maxTableWidth,
    mb: 2,
    width: 'fit-content',
  },

  quantityCell: {
    fontWeight: 600,
    textAlign: 'center',
  },

  priceCell: {
    fontWeight: 700,
    color: 'text.primary',
    textAlign: 'center',
  },

  singlePriceDisplay: {
    fontWeight: 700,
    color: 'text.primary',
    fontSize: '1rem',
    '& .MuiTypography-root': {
      color: 'text.primary',
    },
  },
};

/**
 * Estilos del proveedor
 */
export const SUPPLIER_STYLES = {
  container: {
    display: 'flex',
    alignItems: 'center',
    mb: 3,
    gap: 1.5,
  },

  avatar: {
    width: DIMENSIONS.avatarMd,
    height: DIMENSIONS.avatarMd,
    fontSize: '1rem',
  },

  name: {
    color: 'primary.main',
    fontWeight: 600,
  },

  nameClickable: {
    color: 'primary.main',
    fontWeight: 600,
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },

  nameNotClickable: {
    color: 'primary.main',
    fontWeight: 600,
    cursor: 'default',
    '&:hover': {
      textDecoration: 'none',
    },
  },

  verifiedIcon: {
    fontSize: 20,
    color: 'primary.main',
  },
};

/**
 * Estilos de metadata (stock, compra mínima, chips)
 */
export const METADATA_STYLES = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    mb: 3,
    width: '100%',
    maxWidth: { xs: 'none', md: 500 },
    gap: { xs: 2, md: 1 },
  },

  chipsContainer: {
    display: 'flex',
    gap: { xs: 1.5, md: 1 },
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: { xs: 'flex-start', md: 'flex-start' },
  },

  chip: {
    backgroundColor: 'primary.main',
    color: 'white',
    fontSize: { xs: '0.8rem', md: '0.75rem' },
    '&:hover': { backgroundColor: 'primary.main' },
  },

  stockRow: {
    width: '100%',
  },

  stockText: {
    color: 'text.primary',
  },

  stockOutOfStock: {
    fontWeight: 600,
    color: 'text.primary',
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
};

/**
 * Estilos de acciones (botones de cotización/contacto)
 */
export const ACTION_STYLES = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
    gap: 1,
  },

  containerWithMargin: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    mt: 2,
    mb: 4,
    width: '100%',
    gap: 1,
  },

  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 1,
  },

  textButton: {
    color: 'primary.main',
    textTransform: 'none',
    fontWeight: 600,
    p: 0,
    minWidth: 'auto',
    '&:hover': {
      backgroundColor: 'transparent',
      textDecoration: 'underline',
    },
  },
};

/**
 * Estilos de la galería
 */
export const GALLERY_STYLES = {
  container: {
    flex: { xs: 'none', md: 1 },
    width: '100%',
    minWidth: 0,
    display: 'flex',
    justifyContent: 'center',
    px: 0,
  },
};

/**
 * Estilos de la sección de información
 */
export const INFO_STYLES = {
  container: {
    flex: { xs: 'none', md: 1 },
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    px: { xs: 0, md: 0 },
    width: { xs: '100%', md: '50%' },
    maxWidth: { xs: 'none', md: '50%' },
    mx: { xs: 0, md: 0 },
  },

  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 1,
    mb: 2,
    width: '100%',
  },

  mobileTitleContainer: {
    px: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    order: -1,
  },
};

/**
 * Estilos de IconButton sin efectos visuales
 */
export const ICON_BUTTON_CLEAN = {
  ml: 0.5,
  boxShadow: 'none',
  outline: 'none',
  bgcolor: 'transparent',
  '&:hover': {
    backgroundColor: COLORS.buttonHoverBg,
    boxShadow: 'none',
    outline: 'none',
  },
  '&:active': {
    boxShadow: 'none !important',
    outline: 'none !important',
    background: `${COLORS.buttonHoverBg} !important`,
  },
  '&:focus': {
    boxShadow: 'none !important',
    outline: 'none !important',
    background: `${COLORS.buttonHoverBg} !important`,
  },
  '&:focus-visible': {
    boxShadow: 'none !important',
    outline: 'none !important',
    background: `${COLORS.buttonHoverBg} !important`,
  },
};

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Genera estilos de borde consistentes
 */
export const getBorderStyle = (color = COLORS.border, width = 1) => ({
  border: `${width}px solid ${color}`,
});

/**
 * Genera estilos de sombra consistentes
 */
export const getShadowStyle = (level = 1) => {
  const shadows = {
    1: '0 1px 3px rgba(0,0,0,0.12)',
    2: '0 3px 6px rgba(0,0,0,0.15)',
    3: '0 10px 20px rgba(0,0,0,0.19)',
  };
  return { boxShadow: shadows[level] || shadows[1] };
};

/**
 * Genera estilos responsivos
 */
export const getResponsiveStyle = (mobile, tablet, desktop) => ({
  xs: mobile,
  sm: tablet || mobile,
  md: desktop || tablet || mobile,
});

/**
 * Normaliza nombre de proveedor para slug de URL
 */
export const normalizeProviderSlug = providerName => {
  return providerName
    ?.toLowerCase()
    ?.replace(/\s+/g, '-')
    ?.replace(/[^\w-]/g, '');
};
