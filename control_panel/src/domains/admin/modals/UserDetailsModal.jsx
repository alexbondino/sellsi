/**
 * 👤 Modal de Detalles de Usuario - Versión Profesional
 * 
 * Componente que muestra información completa de un usuario incluyendo:
 * - Datos básicos del usuario con diseño profesional
 * - Información de baneo (fecha, razón, días transcurridos)
 * - Productos activos y estadísticas
 * - Historial de actividad
 * - Acciones disponibles (banear/desbanear)
 * 
 * @author Panel Administrativo Sellsi
 * @date 16 de Julio de 2025
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  Badge,
  Fade,
  Slide,
  LinearProgress,
  Stack,
  CardHeader
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CalendarToday as CalendarIcon,
  Router as IpIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  Business as BusinessIcon,
  LocalShipping as LocalShippingIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';

// Importar servicios
// (Los servicios de ban/unban se manejan desde la tabla principal)

// Importar modal de confirmación de baneo
// (Ya no se usa en este modal, solo se muestra información)

// Estilos personalizados
const modalStyles = {
  dialog: {
    '& .MuiDialog-paper': {
      borderRadius: 3,
      maxWidth: 900,
      width: '85vw',
      maxHeight: '85vh',
      overflow: 'hidden',
      background: '#ffffff',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    }
  },
  header: {
    backgroundColor: 'primary.main',
    color: 'white',
    padding: '20px',
    borderRadius: 0,
    position: 'relative',
    overflow: 'hidden'
  },
  profileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    position: 'relative',
    zIndex: 1
  },
  avatar: {
    width: 56,
    height: 56,
    border: '2px solid rgba(255,255,255,0.3)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  statusCard: {
    background: 'primary.main',
    color: 'white',
    borderRadius: 2,
    '& .MuiCardContent-root': {
      padding: '16px !important'
    }
  },
  infoCard: {
    background: 'primary.light',
    color: 'white',
    borderRadius: 2,
    '& .MuiCardContent-root': {
      padding: '16px !important'
    }
  },
  banCard: {
    background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    border: '1px solid #ff4757',
    borderRadius: 2,
    position: 'relative',
    overflow: 'hidden'
  },
  statBox: {
    textAlign: 'center',
    padding: 1.5,
    borderRadius: 2,
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)'
  },
  actionButton: {
    borderRadius: 2,
    textTransform: 'none',
    fontWeight: 500,
    padding: '8px 20px',
    minWidth: 120,
    boxShadow: 'none',
    '&:hover': {
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      transition: 'all 0.2s ease'
    }
  }
};

const UserDetailsModal = ({ open, user, onClose, onUserUpdated }) => {
  const [loading, setLoading] = useState(false);
  // (Estados relacionados con modal de ban removidos)
  const [error, setError] = useState('');
  const [slideIn, setSlideIn] = useState(false);

  useEffect(() => {
    if (open) {
      setSlideIn(true);
    } else {
      setSlideIn(false);
    }
  }, [open]);

  // Calcular días transcurridos desde el baneo
  const calculateDaysSinceBan = (bannedAt) => {
    if (!bannedAt) return null;
    const banDate = new Date(bannedAt);
    const today = new Date();
    const diffTime = Math.abs(today - banDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Determinar estado del usuario
  const getUserStatus = () => {
    if (!user) return 'active';
    if (user.banned === true) return 'banned';
    if (user.is_active === false) return 'inactive';
    return 'active';
  };

  // Calcular estadísticas del usuario
  const getUserStats = () => {
    const joinedDays = user?.createdt ? Math.ceil((new Date() - new Date(user.createdt)) / (1000 * 60 * 60 * 24)) : 0;
    const activeProducts = user?.active_products_count || 0;
    const userType = user?.main_supplier ? 'supplier' : 'buyer';
    
    return {
      joinedDays,
      activeProducts,
      userType,
      isVerified: user?.verified || false,
      completionRate: calculateProfileCompletion()
    };
  };

  // Calcular completitud del perfil
  const calculateProfileCompletion = () => {
    if (!user) return 0;
    const fields = ['user_nm', 'email', 'phone_nbr', 'country', 'logo_url'];
    const completedFields = fields.filter(field => user[field] && user[field].trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const userStatus = getUserStatus();
  const userStats = getUserStats();
  const daysSinceBan = user?.banned_at ? calculateDaysSinceBan(user.banned_at) : null;

  // Abrir modal de baneo
  // const openBanModal = (action) => {
  //   setBanModal({ open: true, action });
  // };

  // Cerrar modal de baneo
  // const closeBanModal = () => {
  //   setBanModal({ open: false, action: null });
  // };

  // Manejar confirmación de baneo/desbaneo
  // const handleBanConfirm = async (reason) => {
  //   console.log('handleBanConfirm called with reason:', reason);
  //   setLoading(true);
  //   setError('');

  //   try {
  //     let result;
  //     if (banModal.action === 'ban') {
  //       result = await banUser(user.user_id, reason);
  //     } else {
  //       result = await unbanUser(user.user_id, reason);
  //     }

  //     if (result.success) {
  //       closeBanModal();
  //       // Cerrar el modal principal y actualizar la lista
  //       onUserUpdated && onUserUpdated();
  //       onClose();
  //     } else {
  //       setError(result.error || 'Error al procesar la acción');
  //     }
  //   } catch (error) {
  //     console.error('Error en handleBanConfirm:', error);
  //     setError('Error interno del servidor');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  if (!user) return null;

  return (
    <>
      <Dialog 
        open={open} 
        onClose={() => onClose()}
        maxWidth="md" 
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
        sx={modalStyles.dialog}
        disableEscapeKeyDown={false}
      >
        {/* Header Profesional */}
        <Box sx={modalStyles.header}>
          <Box sx={modalStyles.profileSection}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Avatar 
                src={user.logo_url} 
                sx={modalStyles.avatar}
              >
                {user.user_nm?.charAt(0)?.toUpperCase() || '?'}
              </Avatar>
              <Chip
                icon={userStatus === 'active' ? <VerifiedIcon /> : <WarningIcon />}
                label={userStatus === 'active' ? 'Activo' : userStatus === 'banned' ? 'Baneado' : 'Inactivo'}
                color={userStatus === 'active' ? 'success' : userStatus === 'banned' ? 'error' : 'warning'}
                size="small"
                clickable={false}
                sx={{ fontSize: '0.75rem', fontWeight: 500 }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                {user.user_nm || 'Usuario sin nombre'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                ID: {user.user_id || 'ID no disponible'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  icon={user.main_supplier ? <BusinessIcon /> : <AccountCircleIcon />}
                  label={user.main_supplier ? 'Proveedor' : 'Comprador'}
                  size="small"
                  clickable={false}
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.15)', 
                    color: 'white',
                    fontWeight: 500,
                    fontSize: '0.75rem'
                  }}
                />
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {user.email || 'Email no especificado'}
                </Typography>
              </Box>
            </Box>
          </Box>
          <IconButton 
            onClick={() => onClose()}
            sx={{ 
              position: 'absolute',
              top: 12,
              right: 12,
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)'
              },
              zIndex: 10
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ padding: 0 }}>
          <Fade in={slideIn} timeout={500}>
            <Box sx={{ p: 2 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', height: '400px', gap: 2 }}>
                {/* COLUMNA 1: INFORMACIÓN PERSONAL - OCUPA TODA LA ALTURA */}
                <Box sx={{ flex: 1, height: '100%' }}>
                  <Card sx={{ height: '100%', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <CardHeader
                      avatar={<PersonIcon sx={{ color: 'primary.main', fontSize: 20 }} />}
                      title="Información Personal"
                      titleTypographyProps={{ fontWeight: 500, fontSize: '1rem' }}
                      sx={{ backgroundColor: '#fafafa', py: 1, flexShrink: 0 }}
                    />
                    <CardContent sx={{ py: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <EmailIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Email
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.email || 'No especificado'}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <PhoneIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Teléfono
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.phone_nbr || 'No especificado'}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <LocationIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              País
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.country || 'No especificado'}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <CalendarIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Fecha de Registro
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {new Date(user.createdt).toLocaleDateString('es-CL')}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <IpIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Última IP
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                              {user.last_ip || 'No registrada'}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <BusinessIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Tipo de Usuario
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.main_supplier ? 'Proveedor' : 'Comprador'}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <VerifiedIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Estado
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {userStatus === 'active' ? 'Activo' : userStatus === 'banned' ? 'Baneado' : 'Inactivo'}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <InfoIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              ID del Usuario
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.user_id || 'No disponible'}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <VerifiedIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Verificado
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.verified ? 'Sí' : 'No'}
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>

                {/* COLUMNA 2: ESTADÍSTICAS Y COMPLETITUD */}
                <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* FILA SUPERIOR: ESTADÍSTICAS */}
                  <Card sx={{ flex: 1, borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <CardHeader
                      avatar={<TrendingUpIcon sx={{ color: 'primary.main', fontSize: 20 }} />}
                      title="Estadísticas"
                      titleTypographyProps={{ fontWeight: 500, fontSize: '1rem' }}
                      sx={{ backgroundColor: '#fafafa', py: 1, flexShrink: 0 }}
                    />
                    <CardContent sx={{ py: 2, flex: 1 }}>
                      <Grid container spacing={1.5} sx={{ height: '100%' }}>
                        <Grid item xs={6}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 1.5, 
                            borderRadius: 2,
                            backgroundColor: 'primary.main',
                            color: 'white',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {userStats.joinedDays}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                              Días registrado
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 1.5, 
                            borderRadius: 2,
                            backgroundColor: 'primary.light',
                            color: 'white',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {userStats.activeProducts}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                              Productos activos
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, display: 'block' }}>
                              Perfil: {userStats.completionRate}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={userStats.completionRate} 
                              sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                backgroundColor: '#e3f2fd',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: 'primary.main'
                                }
                              }}
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                              Verificación:
                            </Typography>
                            <Chip
                              icon={userStats.isVerified ? <VerifiedIcon sx={{ fontSize: 14 }} /> : <WarningIcon sx={{ fontSize: 14 }} />}
                              label={userStats.isVerified ? 'Verificado' : 'No verificado'}
                              color={userStats.isVerified ? 'success' : 'warning'}
                              size="small"
                              clickable={false}
                              sx={{ fontWeight: 500, height: 24, fontSize: '0.7rem' }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* FILA INFERIOR: COMPLETITUD DEL PERFIL */}
                  <Card sx={{ flex: 1, borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <CardHeader
                      avatar={<AssignmentIcon sx={{ color: 'primary.main', fontSize: 20 }} />}
                      title="Completitud del Perfil"
                      titleTypographyProps={{ fontWeight: 600, fontSize: '1rem' }}
                      sx={{ backgroundColor: '#f8f9fa', py: 1, flexShrink: 0 }}
                    />
                    <CardContent sx={{ py: 2, flex: 1 }}>
                      <Grid container spacing={1} sx={{ height: '100%' }}>
                        {/* Primera fila */}
                        <Grid item xs={6}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 1, 
                            borderRadius: 1,
                            backgroundColor: user.user_nm ? '#e8f5e8' : '#fff3cd',
                            border: `1px solid ${user.user_nm ? '#28a745' : '#ffc107'}`,
                            height: '100%',
                            width: '70px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h6" sx={{ 
                              color: user.user_nm ? '#155724' : '#856404',
                              fontWeight: 700,
                              mb: 0.5,
                              fontSize: '1rem'
                            }}>
                              {user.user_nm ? '✓' : '✗'}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                              Nombre
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 1, 
                            borderRadius: 1,
                            backgroundColor: user.email ? '#e8f5e8' : '#fff3cd',
                            border: `1px solid ${user.email ? '#28a745' : '#ffc107'}`,
                            height: '100%',
                            width: '70px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h6" sx={{ 
                              color: user.email ? '#155724' : '#856404',
                              fontWeight: 700,
                              mb: 0.5,
                              fontSize: '1rem'
                            }}>
                              {user.email ? '✓' : '✗'}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                              Email
                            </Typography>
                          </Box>
                        </Grid>
                        
                        {/* Segunda fila */}
                        <Grid item xs={6}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 1, 
                            borderRadius: 1,
                            backgroundColor: user.phone_nbr ? '#e8f5e8' : '#fff3cd',
                            border: `1px solid ${user.phone_nbr ? '#28a745' : '#ffc107'}`,
                            height: '100%',
                            width: '70px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h6" sx={{ 
                              color: user.phone_nbr ? '#155724' : '#856404',
                              fontWeight: 700,
                              mb: 0.5,
                              fontSize: '1rem'
                            }}>
                              {user.phone_nbr ? '✓' : '✗'}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                              Teléfono
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 1, 
                            borderRadius: 1,
                            backgroundColor: user.country ? '#e8f5e8' : '#fff3cd',
                            border: `1px solid ${user.country ? '#28a745' : '#ffc107'}`,
                            height: '100%',
                            width: '70px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h6" sx={{ 
                              color: user.country ? '#155724' : '#856404',
                              fontWeight: 700,
                              mb: 0.5,
                              fontSize: '1rem'
                            }}>
                              {user.country ? '✓' : '✗'}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                              País
                            </Typography>
                          </Box>
                        </Grid>
                        
                        {/* Tercera fila para la foto */}
                        <Grid item xs={12}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 1, 
                            borderRadius: 1,
                            backgroundColor: user.logo_url ? '#e8f5e8' : '#fff3cd',
                            border: `1px solid ${user.logo_url ? '#28a745' : '#ffc107'}`,
                            height: '100%',
                            width: '70px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h6" sx={{ 
                              color: user.logo_url ? '#155724' : '#856404',
                              fontWeight: 700,
                              mb: 0.5,
                              fontSize: '1rem'
                            }}>
                              {user.logo_url ? '✓' : '✗'}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                              Foto de Perfil
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* INFORMACIÓN DE BANEO - FULL WIDTH */}
              {userStatus === 'banned' && (
                <Box sx={{ mt: 2 }}>
                  <Card sx={{
                    ...modalStyles.banCard,
                    '& .MuiCardContent-root': { py: 2 }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <SecurityIcon sx={{ color: '#ff0015ff', fontSize: 20 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#fb0015ff', fontSize: '1rem' }}>
                          Usuario Baneado
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Paper sx={{ p: 1.5, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <CalendarIcon sx={{ color: '#ff4757', fontSize: 16 }} />
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                Fecha de Baneo
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                              {user.banned_at ? new Date(user.banned_at).toLocaleString('es-CL') : 'No especificada'}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Paper sx={{ p: 1.5, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <TimeIcon sx={{ color: '#ff4757', fontSize: 16 }} />
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                Tiempo Transcurrido
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                              {daysSinceBan ? `${daysSinceBan} día${daysSinceBan > 1 ? 's' : ''}` : 'No calculado'}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Paper sx={{ p: 1.5, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <WarningIcon sx={{ color: '#ff4757', fontSize: 16 }} />
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                Razón del Baneo
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                              {user.banned_reason || 'No especificada'}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Box>
          </Fade>
        </DialogContent>

        <DialogActions sx={{ padding: 2, backgroundColor: '#fafafa', justifyContent: 'center' }}>
          <Button 
            onClick={() => onClose()} 
            color="primary"
            variant="contained"
            sx={{ 
              ...modalStyles.actionButton,
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserDetailsModal;
