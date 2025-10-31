/**
 * 🔧 Componente para Crear Cuentas Administrativas
 * 
 * Permite a administradores crear nuevas cuentas para el panel de control.
 * Incluye validación de contraseñas seguras y configuración de 2FA opcional.
 * 
 * @author Panel Administrativo Sellsi
 * @date 16 de Julio de 2025
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  Chip,
  LinearProgress,
  Grid,
  IconButton,
  InputAdornment,
  Divider,
  Button,
  Card,
  CardContent,
  Paper,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  Security,
  CheckCircle,
  Cancel,
  PersonAdd,
  Block,
  Email,
  Person,
  VpnKey,
  Shield
} from '@mui/icons-material';

import { PrimaryButton } from '../../../shared/components/forms';
// Refactor anti-ciclos: importación directa de servicios en lugar del barrel '../../../domains/admin'
import { createAdminAccount, canCreateAdmins } from '../services/adminAccountService';
import { 
  canCreateAdminInDev, 
  isDevelopment, 
  FIRST_ADMIN_CONFIG 
} from '../config/devConfig';

// ✅ VALIDACIÓN DE CONTRASEÑA
const validatePassword = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  const strength = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong';
  
  return { checks, score, strength };
};

// ✅ ROLES DISPONIBLES
const ADMIN_ROLES = {
  admin: {
    label: 'Administrador',
    description: 'Acceso completo al sistema',
    color: 'primary'
  }
};

const AdminAccountCreator = ({ open, onClose, onSuccess }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    usuario: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'admin',
    enable_2fa: true, // Siempre habilitado para administradores
    notes: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canCreate, setCanCreate] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  // Estilos profesionales
  const modalStyles = {
    dialog: {
      '& .MuiDialog-paper': {
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        maxWidth: '700px',
        width: '100%'
      }
    },
    header: {
      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      color: 'white',
      padding: '24px 32px',
      margin: 0,
      '& .MuiTypography-h6': {
        fontWeight: 600,
        fontSize: '1.25rem'
      }
    },
    content: {
      padding: '32px',
      maxHeight: '70vh',
      overflowY: 'auto'
    },
    sectionCard: {
      backgroundColor: alpha(theme.palette.primary.main, 0.03),
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        borderColor: alpha(theme.palette.primary.main, 0.12),
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
      }
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '16px',
      color: theme.palette.primary.main,
      fontWeight: 600,
      fontSize: '1.1rem'
    },
    inputField: {
      '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        backgroundColor: 'white',
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
          borderWidth: '2px'
        }
      },
      '& .MuiInputLabel-root': {
        fontWeight: 500
      }
    },
    actions: {
      padding: '24px 32px',
      borderTop: `1px solid ${theme.palette.divider}`,
      backgroundColor: alpha(theme.palette.grey[100], 0.5),
      gap: '12px'
    },
    primaryButton: {
      borderRadius: '8px',
      padding: '12px 24px',
      textTransform: 'none',
      fontWeight: 600,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      '&:hover': {
        boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
      }
    },
    secondaryButton: {
      borderRadius: '8px',
      padding: '12px 24px',
      textTransform: 'none',
      fontWeight: 500,
      border: `1px solid ${theme.palette.divider}`,
      '&:hover': {
        backgroundColor: alpha(theme.palette.grey[100], 0.8)
      }
    }
  };

  // Verificar permisos al abrir el modal
  React.useEffect(() => {
    if (open) {
      checkCreatePermissions();
    }
  }, [open]);

  const checkCreatePermissions = async () => {
    try {
      // 🚧 MODO DESARROLLO: Permitir crear admins sin autenticación
      if (canCreateAdminInDev()) {
        console.log('🚧 MODO DESARROLLO: Saltando verificación de permisos');
        setCanCreate(true);
        setError('');
        setCheckingPermissions(false);
        return;
      }

      const adminUser = localStorage.getItem('adminUser');
      if (!adminUser) {
        setError('No hay sesión administrativa activa');
        setCanCreate(false);
        return;
      }

      const user = JSON.parse(adminUser);
      const result = await canCreateAdmins(user.id);
      
      if (result.success) {
        setCanCreate(true);
        setError('');
      } else {
        setError(result.error || 'Sin permisos para crear administradores');
        setCanCreate(false);
      }
    } catch (error) {
      console.error('Error verificando permisos:', error);
      setError('Error verificando permisos');
      setCanCreate(false);
    } finally {
      setCheckingPermissions(false);
    }
  };

  // ========================================
  // 🔧 HANDLERS
  // ========================================

  const handleInputChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 🚧 MODO DESARROLLO: Saltar verificación de sesión
      if (!canCreateAdminInDev()) {
        // Verificar permisos nuevamente antes de crear
        const adminUser = localStorage.getItem('adminUser');
        if (!adminUser) {
          setError('Sesión administrativa expirada');
          return;
        }
      }

      // Validaciones
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }

      const passwordValidation = validatePassword(formData.password);
      if (passwordValidation.strength === 'weak') {
        setError('La contraseña debe ser más segura');
        return;
      }

      // Crear cuenta
      const dataToSend = {
        email: formData.email,
        password: formData.password,
        fullName: formData.full_name, // Mapear full_name a fullName
        usuario: formData.usuario,
        role: formData.role,
        enable_2fa: formData.enable_2fa,
        notes: formData.notes
      };
      
      const result = await createAdminAccount(dataToSend);
      
      if (result.success) {
        setSuccess('Cuenta administrativa creada exitosamente');
        setTimeout(() => {
          onSuccess && onSuccess(result.user);
          handleClose();
        }, 2000);
      } else {
        setError(result.error || 'Error al crear la cuenta');
      }
    } catch (error) {
      console.error('Error creating admin account:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      usuario: '',
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      role: 'admin',
      enable_2fa: true, // Siempre habilitado para administradores
      notes: ''
    });
    setError('');
    setSuccess('');
    setCanCreate(false);
    setCheckingPermissions(true);
    onClose();
  };

  // ========================================
  // 🎨 RENDER HELPERS
  // ========================================

  const renderPasswordStrength = () => {
    const validation = validatePassword(formData.password);
    const colors = { weak: 'error', medium: 'warning', strong: 'success' };
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Fortaleza de contraseña
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={(validation.score / 5) * 100}
          color={colors[validation.strength]}
          sx={{ 
            height: 8, 
            borderRadius: 4,
            backgroundColor: alpha(theme.palette.grey[300], 0.3),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4
            }
          }}
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
          {Object.entries(validation.checks).map(([key, passed]) => (
            <Chip
              key={key}
              size="small"
              icon={passed ? <CheckCircle /> : <Cancel />}
              label={key === 'length' ? '8+ caracteres' : 
                     key === 'uppercase' ? 'Mayúscula' :
                     key === 'lowercase' ? 'Minúscula' :
                     key === 'number' ? 'Número' :
                     key === 'special' ? 'Especial' : key}
              color={passed ? 'success' : 'default'}
              variant={passed ? 'filled' : 'outlined'}
              sx={{
                fontSize: '0.75rem',
                height: '24px',
                '& .MuiChip-icon': {
                  fontSize: '14px'
                }
              }}
            />
          ))}
        </Box>
      </Box>
    );
  };

  const isFormValid = () => {
    return (
      formData.usuario &&
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      formData.full_name &&
      formData.password === formData.confirmPassword &&
      validatePassword(formData.password).strength !== 'weak'
    );
  };

  const renderPermissionDenied = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <Paper sx={{ 
        p: 4, 
        maxWidth: 400,
        textAlign: 'center',
        borderRadius: '12px',
        backgroundColor: alpha(theme.palette.error.main, 0.05),
        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
      }}>
        <Avatar sx={{ 
          width: 56, 
          height: 56, 
          mx: 'auto', 
          mb: 2,
          backgroundColor: theme.palette.error.main 
        }}>
          <Block sx={{ fontSize: 28 }} />
        </Avatar>
        <Typography variant="h6" gutterBottom color="error">
          Acceso Denegado
        </Typography>
        <Typography variant="body2" color="textSecondary">
          No tienes permisos para crear nuevas cuentas administrativas.
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Contacta a otro administrador si necesitas acceso.
        </Typography>
      </Paper>
    </Box>
  );

  const renderCheckingPermissions = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
      <Box sx={{ textAlign: 'center' }}>
        <LinearProgress sx={{ width: 200, mb: 2 }} />
        <Typography variant="body2" color="textSecondary">
          Verificando permisos administrativos...
        </Typography>
      </Box>
    </Box>
  );

  // ========================================
  // 🎨 MAIN RENDER
  // ========================================

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth sx={modalStyles.dialog}>
      <DialogTitle sx={modalStyles.header}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ 
            backgroundColor: 'white',
            color: theme.palette.primary.main,
            width: 40,
            height: 40
          }}>
            <PersonAdd />
          </Avatar>
          <Box>
            <Typography variant="h6">Crear Cuenta Administrativa</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Modo desarrollo: Puedes crear la primera cuenta admin sin restricciones
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit} autoComplete="off">
        <DialogContent sx={modalStyles.content}>
          {checkingPermissions && renderCheckingPermissions()}

          {!checkingPermissions && !canCreate && renderPermissionDenied()}

          {!checkingPermissions && canCreate && (
            <>
              {/* Alerta de modo desarrollo */}
              {isDevelopment() && (
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 3,
                    borderRadius: '8px',
                    backgroundColor: alpha(theme.palette.info.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Shield />
                    <Typography variant="body2">
                      <strong>MODO DESARROLLO:</strong> {FIRST_ADMIN_CONFIG.DEV_MESSAGE}
                    </Typography>
                  </Box>
                </Alert>
              )}

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    borderRadius: '8px',
                    backgroundColor: alpha(theme.palette.error.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                  }}
                >
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 3,
                    borderRadius: '8px',
                    backgroundColor: alpha(theme.palette.success.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                  }}
                >
                  {success}
                </Alert>
              )}

              {/* Información básica */}
              <Card sx={modalStyles.sectionCard}>
                <CardContent sx={{ padding: '0 !important' }}>
                  <Typography variant="h6" sx={modalStyles.sectionTitle}>
                    <Person sx={{ mr: 1 }} />
                    Información Básica
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Usuario"
                        value={formData.usuario}
                        onChange={handleInputChange('usuario')}
                        required
                        sx={modalStyles.inputField}
                        autoComplete="off"
                        autoFocus={false}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AdminPanelSettings color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        inputProps={{
                          autoComplete: 'new-password', // Truco para evitar autocompletado
                          form: {
                            autoComplete: 'off',
                          },
                        }}
                        helperText="Username único para iniciar sesión"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        required
                        sx={modalStyles.inputField}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        helperText="Email para notificaciones"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nombre Completo"
                        value={formData.full_name}
                        onChange={handleInputChange('full_name')}
                        required
                        sx={modalStyles.inputField}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        helperText="Nombre real del administrador"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Configuración de Seguridad */}
              <Card sx={modalStyles.sectionCard}>
                <CardContent sx={{ padding: '0 !important' }}>
                  <Typography variant="h6" sx={modalStyles.sectionTitle}>
                    <Security sx={{ mr: 1 }} />
                    Configuración de Seguridad
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Contraseña"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange('password')}
                        required
                        sx={modalStyles.inputField}
                        autoComplete="new-password"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <VpnKey color="primary" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        inputProps={{
                          autoComplete: 'new-password',
                          form: {
                            autoComplete: 'off',
                          },
                        }}
                      />
                      {formData.password && renderPasswordStrength()}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Confirmar Contraseña"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleInputChange('confirmPassword')}
                        required
                        sx={modalStyles.inputField}
                        autoComplete="new-password"
                        error={formData.confirmPassword && formData.password !== formData.confirmPassword}
                        helperText={
                          formData.confirmPassword && formData.password !== formData.confirmPassword
                            ? 'Las contraseñas no coinciden'
                            : 'Repite la contraseña'
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <VpnKey color="primary" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        inputProps={{
                          autoComplete: 'new-password',
                          form: {
                            autoComplete: 'off',
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        height: '100%',
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        borderRadius: '8px',
                        padding: '16px',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Shield color="primary" />
                          <Box>
                            <Typography variant="body2" fontWeight={500} color="primary.main">
                              Rol: Administrador
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Acceso completo al sistema
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        height: '100%',
                        backgroundColor: alpha(theme.palette.success.main, 0.08),
                        borderRadius: '8px',
                        padding: '16px',
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Shield color="success" />
                          <Box>
                            <Typography variant="body2" fontWeight={500} color="success.main">
                              2FA Habilitado
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Requerido para administradores
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Notas adicionales */}
              <Card sx={modalStyles.sectionCard}>
                <CardContent sx={{ padding: '0 !important' }}>
                  <Typography variant="h6" sx={modalStyles.sectionTitle}>
                    Notas Adicionales
                  </Typography>
                  <TextField
                    fullWidth
                    label="Notas"
                    value={formData.notes}
                    onChange={handleInputChange('notes')}
                    multiline
                    rows={3}
                    sx={modalStyles.inputField}
                    placeholder="Información adicional sobre este administrador..."
                  />
                </CardContent>
              </Card>
            </>
          )}
        </DialogContent>

        <DialogActions sx={modalStyles.actions}>
          <Button 
            onClick={handleClose} 
            variant="outlined" 
            sx={modalStyles.secondaryButton}
          >
            Cancelar
          </Button>
          {canCreate && (
            <PrimaryButton
              type="submit"
              loading={loading}
              disabled={!isFormValid() || !canCreate}
              startIcon={<PersonAdd />}
              sx={modalStyles.primaryButton}
            >
              Crear Cuenta
            </PrimaryButton>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AdminAccountCreator;
