import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
  Link,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  Select,
  FormControl,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Fade from '@mui/material/Fade';
import { styled } from '@mui/material/styles';
import StepConnector, {
  stepConnectorClasses,
} from '@mui/material/StepConnector';
import Check from '@mui/icons-material/Check';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BusinessIcon from '@mui/icons-material/Business';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import StorefrontIcon from '@mui/icons-material/Storefront'; // ✅ NUEVO: Icono de marketplace

// Actualiza el array de países CON emojis
const countries = [
  { code: 'CL', name: 'Chile', phone: '+56', flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina', phone: '+54', flag: '🇦🇷' },
  { code: 'MX', name: 'México', phone: '+52', flag: '🇲🇽' },
  { code: 'CO', name: 'Colombia', phone: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', phone: '+51', flag: '🇵🇪' },
  { code: 'EC', name: 'Ecuador', phone: '+593', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', phone: '+591', flag: '🇧🇴' },
  { code: 'UY', name: 'Uruguay', phone: '+598', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', phone: '+595', flag: '🇵🇾' },
  { code: 'VE', name: 'Venezuela', phone: '+58', flag: '🇻🇪' },
  { code: 'BR', name: 'Brasil', phone: '+55', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', phone: '+1', flag: '🇺🇸' },
  { code: 'ES', name: 'España', phone: '+34', flag: '🇪🇸' },
];

// Conector colorido (estilo Colorlib)
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        'linear-gradient(95deg, #41B6E6 0%, #2fa4d6 50%, #1976d2 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        'linear-gradient(95deg, #41B6E6 0%, #2fa4d6 50%, #1976d2 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: '#eaeaf0',
    borderRadius: 1,
    ...theme.applyStyles('dark', {
      backgroundColor: theme.palette.grey[800],
    }),
  },
}));

// Icono colorido (estilo Colorlib)
const ColorlibStepIconRoot = styled('div')(({ theme }) => ({
  backgroundColor: '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...theme.applyStyles('dark', {
    backgroundColor: theme.palette.grey[700],
  }),
  variants: [
    {
      props: ({ ownerState }) => ownerState.active,
      style: {
        backgroundImage:
          'linear-gradient(136deg, #41B6E6 0%, #2fa4d6 50%, #1976d2 100%)',
        boxShadow: '0 4px 10px 0 rgba(65, 182, 230, 0.25)',
      },
    },
    {
      props: ({ ownerState }) => ownerState.completed,
      style: {
        backgroundImage:
          'linear-gradient(136deg, #41B6E6 0%, #2fa4d6 50%, #1976d2 100%)',
      },
    },
  ],
}));

function ColorlibStepIcon(props) {
  const { active, completed, className } = props;

  const icons = {
    1: <AccountCircleIcon />,
    2: <BusinessIcon />,
    3: <PersonAddIcon />,
    4: <CheckCircleIcon />,
  };

  return (
    <ColorlibStepIconRoot
      ownerState={{ completed, active }}
      className={className}
    >
      {icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
}

// Barra de progreso con estilo Colorlib
function BarraProgreso({ paso }) {
  const steps = [
    'Creación de Cuenta',
    'Tipo de Cuenta',
    'Completar Información',
    'Cuenta Creada',
  ];

  return (
    <Box sx={{ width: '100%', mb: 4, mt: 2 }}>
      <Stepper
        activeStep={paso - 1}
        alternativeLabel
        connector={<ColorlibConnector />}
        sx={{
          '& .MuiStepLabel-label': {
            fontSize: '12px',
            fontWeight: 500,
            color: '#666',
          },
          '& .MuiStepLabel-label.Mui-active': {
            color: '#41B6E6',
            fontWeight: 600,
          },
          '& .MuiStepLabel-label.Mui-completed': {
            color: '#41B6E6',
            fontWeight: 600,
          },
        }}
      >
        {steps.map(label => (
          <Step key={label}>
            <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

export default function Register({ open, onClose }) {
  const theme = useTheme();
  const [paso, setPaso] = useState(1);
  const [codigoVerificacion, setCodigoVerificacion] = useState([
    '',
    '',
    '',
    '',
    '',
  ]);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [showCodigoEnviado, setShowCodigoEnviado] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const fadeTimeout = useRef();

  // Estado para paso 1
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [repiteContrasena, setRepiteContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaComunicaciones, setAceptaComunicaciones] = useState(false);

  // Estado para paso 2
  const [tipoCuenta, setTipoCuenta] = useState('');

  // Estado para paso 3
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [nombrePersonal, setNombrePersonal] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [codigoPais, setCodigoPais] = useState('CL');
  const [logoEmpresa, setLogoEmpresa] = useState(null);
  const [logoError, setLogoError] = useState('');

  // Key para forzar desmontaje/remontaje
  const [dialogKey, setDialogKey] = useState(0);

  // Timer para el código de verificación
  const [timer, setTimer] = useState(300);
  const timerRef = useRef();

  // Detectar navegación del browser para cerrar modal
  useEffect(() => {
    const handlePopState = () => {
      if (open) {
        onClose();
      }
    };

    if (open) {
      window.addEventListener('popstate', handlePopState);
      window.history.pushState(null, '', window.location.href);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (paso === 4) {
      setTimer(300);
      timerRef.current = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [paso]);

  useEffect(() => {
    if (timer === 0) {
      clearInterval(timerRef.current);
    }
  }, [timer]);

  useEffect(() => {
    if (showCodigoEnviado) {
      setFadeIn(true);
      fadeTimeout.current = setTimeout(() => {
        setFadeIn(false);
        setTimeout(() => setShowCodigoEnviado(false), 400);
      }, 15000);
    }
    return () => clearTimeout(fadeTimeout.current);
  }, [showCodigoEnviado]);

  const handleLogoChange = e => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 300 * 1024) {
        setLogoError('El tamaño del archivo excede los 300 KB.');
        setLogoEmpresa(null);
        return;
      }
      setLogoError('');
      const reader = new FileReader();
      reader.onload = ev => setLogoEmpresa(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Validaciones de contraseña
  const requisitos = [
    { label: 'Al menos 8 caracteres', valid: contrasena.length >= 8 },
    { label: 'Letras minúsculas (a-z)', valid: /[a-z]/.test(contrasena) },
    { label: 'Letras mayúsculas (A-Z)', valid: /[A-Z]/.test(contrasena) },
    { label: 'Números (0-9)', valid: /\d/.test(contrasena) },
  ];
  const requisitosValidos = requisitos.filter(r => r.valid).length;
  const cumpleMinimos = requisitosValidos >= 4;

  // Validación de correo electrónico
  const correoValido = /^[^@]+@[^@]+\.[^@]+$/;
  const correoEsValido = correoValido.test(correo);

  // Validación de repetición de contraseña
  const contrasenasCoinciden =
    contrasena === repiteContrasena && repiteContrasena.length > 0;

  const resetForm = () => {
    setPaso(1);
    setCorreo('');
    setContrasena('');
    setRepiteContrasena('');
    setShowPassword(false);
    setShowRepeatPassword(false);
    setAceptaTerminos(false);
    setAceptaComunicaciones(false);
    setTipoCuenta('');
    setNombreEmpresa('');
    setNombrePersonal('');
    setTelefonoContacto('');
    setCodigoPais('CL');
    setLogoEmpresa(null);
    setLogoError('');
    setCodigoVerificacion(['', '', '', '', '']);
    setTimer(300);
    clearInterval(timerRef.current);
  };

  const resetPaso4 = () => {
    setCodigoVerificacion(['', '', '', '', '']);
    setTimer(300);
    clearInterval(timerRef.current);
  };

  const handleExited = () => {
    resetForm();
    setDialogKey(k => k + 1);
  };

  const handleDialogClose = (event, reason) => {
    if (
      (paso === 2 || paso === 3 || paso === 4 || paso === 5) &&
      reason === 'backdropClick'
    ) {
      return;
    }
    onClose(event, reason);
  };

  const handleVolverPaso4 = () => {
    resetPaso4();
    setPaso(3);
  };

  // Componente SelectorPais COMPLETAMENTE REESCRITO
  function SelectorPais({ value, onChange, disabled = false }) {
    return (
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          displayEmpty
          renderValue={selected => {
            const country = countries.find(c => c.code === selected);
            if (!country) return '';
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span
                  style={{
                    fontSize: '16px',
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
                  }}
                >
                  {country.flag}
                </span>
                <span>{country.phone}</span>
              </Box>
            );
          }}
          sx={{
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            },
          }}
        >
          {countries.map(country => (
            <MenuItem
              key={country.code}
              value={country.code}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <span
                style={{
                  fontSize: '16px',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
                }}
              >
                {country.flag}
              </span>
              <span>{country.phone}</span>
              <span
                style={{
                  color: '#666',
                  fontSize: '12px',
                  marginLeft: '8px',
                }}
              >
                {country.name}
              </span>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <Dialog
      key={dialogKey}
      open={open}
      onClose={handleDialogClose}
      onExited={handleExited}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          width: '90vw',
          maxWidth: 1050,
          height: '85vh',
          maxHeight: '800px',
          overflowX: 'hidden',
        },
      }}
    >
      <DialogTitle sx={{ p: 0, pb: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 12,
            right: 8,
            color: '#41B6E6',
            fontWeight: 700,
            fontSize: 16,
            textTransform: 'uppercase',
            minWidth: 'auto',
            height: 'auto',
            padding: '6px 12px 20px 12px', // 6px arriba, 12px lados, 20px abajo
            lineHeight: 1,
            '&:hover': {
              backgroundColor: 'rgba(65, 182, 230, 0.08)',
            },
          }}
        >
          CERRAR
        </Button>
      </DialogTitle>
      <DialogContent sx={{ overflowX: 'hidden', px: { xs: 2, sm: 3 }, pt: 1 }}>
        <BarraProgreso paso={paso} />

        {/* Paso 1: Registro */}
        {paso === 1 && (
          <Box
            sx={{
              maxWidth: 520,
              width: '100%',
              mx: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 1,
              mt: 0,
            }}
          >
            <img
              src="/logo.svg"
              alt="SELLSI Logo"
              style={{ width: 160, marginBottom: 8 }}
            />
            <Typography
              variant="h6"
              align="center"
              sx={{
                mb: 4,
                color: theme.palette.mode === 'dark' ? '#fff' : '#222',
                fontWeight: 700,
                fontSize: 18,
                fontStyle: 'italic',
              }}
            >
              Conecta. Vende. Crece.
            </Typography>
            <form
              onSubmit={e => {
                e.preventDefault();
                setPaso(2);
              }}
              style={{ width: '100%' }}
            >
              <TextField
                label="Correo electrónico"
                variant="outlined"
                fullWidth
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                sx={{ mb: 1.5 }}
                size="small"
                error={correo.length > 0 && !correoEsValido}
                helperText={
                  correo.length > 0 && !correoEsValido
                    ? 'Correo inválido. Ejemplo: usuario@dominio.com'
                    : ''
                }
              />
              <TextField
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
                sx={{ mb: 1.5 }}
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(show => !show)}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Repita su Contraseña"
                type={showRepeatPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                value={repiteContrasena}
                onChange={e => setRepiteContrasena(e.target.value)}
                sx={{ mb: 1.5 }}
                size="small"
                error={repiteContrasena.length > 0 && !contrasenasCoinciden}
                helperText={
                  repiteContrasena.length > 0 && !contrasenasCoinciden
                    ? 'Las contraseñas no coinciden'
                    : ''
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle repeat password visibility"
                        onClick={() => setShowRepeatPassword(show => !show)}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                      >
                        {showRepeatPassword ? (
                          <Visibility />
                        ) : (
                          <VisibilityOff />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  mb: 1.5,
                  background: theme.palette.background.default,
                  fontSize: 13,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <Typography sx={{ fontWeight: 700, mb: 0.5, fontSize: 13 }}>
                  Tu contraseña debe reunir las siguientes condiciones:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                  {requisitos.map((req, idx) => (
                    <li
                      key={idx}
                      style={{
                        color: req.valid ? 'green' : undefined,
                        marginBottom: '2px',
                      }}
                    >
                      {req.valid ? '✓' : '•'} {req.label}
                    </li>
                  ))}
                </ul>
              </Paper>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={aceptaTerminos}
                    onChange={e => setAceptaTerminos(e.target.checked)}
                    sx={{ color: '#41B6E6' }}
                    size="small"
                  />
                }
                label={
                  <span style={{ fontSize: 13 }}>
                    Acepto los{' '}
                    <Link href="#" sx={{ color: '#1976d2', fontWeight: 700 }}>
                      Términos y Condiciones
                    </Link>{' '}
                    y la{' '}
                    <Link href="#" sx={{ color: '#1976d2', fontWeight: 700 }}>
                      Política de Privacidad
                    </Link>
                  </span>
                }
                sx={{ mb: 0.5 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={aceptaComunicaciones}
                    onChange={e => setAceptaComunicaciones(e.target.checked)}
                    sx={{ color: '#41B6E6' }}
                    size="small"
                  />
                }
                label={
                  <span style={{ fontSize: 13 }}>
                    Acepto recibir avisos de ofertas y novedades de Sellsi.
                  </span>
                }
                sx={{ mb: 1.5 }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={
                  !cumpleMinimos ||
                  !aceptaTerminos ||
                  !correoEsValido ||
                  !contrasenasCoinciden
                }
                sx={{
                  backgroundColor:
                    cumpleMinimos &&
                    aceptaTerminos &&
                    correoEsValido &&
                    contrasenasCoinciden
                      ? '#41B6E6'
                      : '#b0c4cc',
                  color: '#fff',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: 16,
                  width: '100%',
                  height: 42,
                  boxShadow: 'none',
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor:
                      cumpleMinimos &&
                      aceptaTerminos &&
                      correoEsValido &&
                      contrasenasCoinciden
                        ? '#2fa4d6'
                        : '#b0c4cc',
                  },
                }}
              >
                Crear cuenta
              </Button>
              <Button
                variant="text"
                onClick={onClose}
                sx={{
                  color: '#1976d2',
                  fontWeight: 700,
                  fontSize: 14,
                  width: '100%',
                  mt: 0.5,
                }}
              >
                Volver atrás
              </Button>
            </form>
          </Box>
        )}

        {/* Paso 2: Selección de tipo de cuenta */}
        {paso === 2 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight={300}
          >
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                mt: 2,
                fontWeight: 700,
                textAlign: 'center',
                fontSize: 22,
              }}
            >
              Elige el tipo de cuenta predeterminado
            </Typography>
            <Box
              display="flex"
              gap={{ xs: 2, sm: 3, md: 4 }}
              width="100%"
              justifyContent="center"
              flexWrap="wrap"
              sx={{ px: { xs: 1, sm: 2 } }}
            >
              {/* Cuenta Proveedor */}
              <Paper
                elevation={3}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  minWidth: { xs: 280, sm: 300 },
                  maxWidth: 350,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: 280,
                  border:
                    tipoCuenta === 'proveedor'
                      ? `2px solid #41B6E6`
                      : `2px solid #eee`,
                  background:
                    tipoCuenta === 'proveedor' ? '#f0fbff' : '#fafbfc',
                  transition: 'border 0.2s, background 0.2s',
                }}
              >
                <Box flexGrow={1} width="100%">
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 0.5,
                      color: '#222',
                      fontSize: 18,
                    }}
                  >
                    Cuenta Proveedor
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#888', mb: 1, fontSize: 13 }}
                  >
                    Regístrate como proveedor para:
                  </Typography>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 16,
                      color: '#444',
                      fontSize: 13,
                      lineHeight: 1.3,
                    }}
                  >
                    <li style={{ marginBottom: '3px' }}>
                      Crear el perfil de tu empresa y promocionar tus productos
                    </li>
                    <li style={{ marginBottom: '3px' }}>
                      Recibir solicitudes de compradores
                    </li>
                    <li style={{ marginBottom: '3px' }}>
                      Acceder a una base de datos de compradores
                    </li>
                    <li style={{ marginBottom: '3px' }}>
                      Ofrecer productos a leads de compradores
                    </li>
                    <li>Comerciar carga no reclamada</li>
                  </ul>
                </Box>
                <Button
                  sx={{
                    width: '100%',
                    backgroundColor:
                      tipoCuenta === 'proveedor' ? '#41B6E6' : '#b0c4cc',
                    color: '#fff',
                    fontWeight: 700,
                    textTransform: 'none',
                    mt: 1.5,
                    height: 36,
                    fontSize: 14,
                    '&:hover': { backgroundColor: '#2fa4d6' },
                  }}
                  onClick={() => setTipoCuenta('proveedor')}
                >
                  Elegir
                </Button>
              </Paper>
              {/* Cuenta Comprador */}
              <Paper
                elevation={3}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  minWidth: { xs: 280, sm: 300 },
                  maxWidth: 350,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: 280,
                  border:
                    tipoCuenta === 'comprador'
                      ? `2px solid #41B6E6`
                      : `2px solid #eee`,
                  background:
                    tipoCuenta === 'comprador' ? '#f0fbff' : '#fafbfc',
                  transition: 'border 0.2s, background 0.2s',
                }}
              >
                <Box flexGrow={1} width="100%">
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 0.5,
                      color: '#222',
                      fontSize: 18,
                    }}
                  >
                    Cuenta Comprador
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#888', mb: 1, fontSize: 13 }}
                  >
                    Regístrate como comprador para:
                  </Typography>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 16,
                      color: '#444',
                      fontSize: 13,
                      lineHeight: 1.3,
                    }}
                  >
                    <li style={{ marginBottom: '3px' }}>
                      Buscar productos y solicitar cotizaciones a proveedores
                    </li>
                    <li style={{ marginBottom: '3px' }}>
                      Crear solicitudes para que proveedores te contacten
                    </li>
                    <li>Acceder a carga no reclamada</li>
                  </ul>
                </Box>
                <Button
                  variant="contained"
                  sx={{
                    width: '100%',
                    backgroundColor:
                      tipoCuenta === 'comprador' ? '#41B6E6' : '#b0c4cc',
                    color: '#fff',
                    fontWeight: 700,
                    textTransform: 'none',
                    mt: 1.5,
                    height: 36,
                    fontSize: 14,
                    '&:hover': { backgroundColor: '#2fa4d6' },
                  }}
                  onClick={() => setTipoCuenta('comprador')}
                >
                  Elegir
                </Button>
              </Paper>
            </Box>
            <Box
              mt={4}
              display="flex"
              flexDirection="column"
              alignItems="center"
              width="100%"
            >
              <Typography
                sx={{ color: '#888', fontSize: 12, mb: 2, textAlign: 'center' }}
              >
                *Podrás cambiar el tipo de cuenta más adelante desde la
                configuración de tu perfil.
              </Typography>
              <Box sx={{ width: '100%', maxWidth: 400 }}>
                <Button
                  variant="contained"
                  disabled={!tipoCuenta}
                  onClick={() => setPaso(3)}
                  sx={{
                    backgroundColor: tipoCuenta ? '#41B6E6' : '#b0c4cc',
                    color: '#fff',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: 16,
                    width: '100%',
                    height: 42,
                    boxShadow: 'none',
                    mb: 0.5,
                    '&:hover': {
                      backgroundColor: tipoCuenta ? '#2fa4d6' : '#b0c4cc',
                    },
                  }}
                >
                  Continuar
                </Button>
                <Button
                  variant="text"
                  onClick={() => setPaso(1)}
                  sx={{
                    color: '#1976d2',
                    fontWeight: 700,
                    fontSize: 14,
                    width: '100%',
                    mt: 0.5,
                  }}
                >
                  Volver atrás
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* Paso 3: Formulario de datos */}
        {paso === 3 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight={300}
          >
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                mt: 2,
                fontWeight: 700,
                textAlign: 'center',
                fontSize: 22,
              }}
            >
              {tipoCuenta === 'proveedor'
                ? 'Completa los datos de tu empresa'
                : 'Completa tus datos personales'}
            </Typography>
            <Box
              component="form"
              sx={{
                width: '100%',
                maxWidth: tipoCuenta === 'proveedor' ? 850 : 380,
                display: 'flex',
                flexDirection:
                  tipoCuenta === 'proveedor'
                    ? { xs: 'column', md: 'row' }
                    : 'column',
                gap: { xs: 2, md: 4 },
                justifyContent: 'center',
                alignItems: 'flex-start',
                mb: 2,
              }}
              noValidate
              autoComplete="off"
            >
              {tipoCuenta === 'proveedor' ? (
                <>
                  <Box sx={{ flex: 1, minWidth: 320 }}>
                    <TextField
                      label="Nombre de Empresa"
                      variant="outlined"
                      fullWidth
                      value={nombreEmpresa}
                      onChange={e => setNombreEmpresa(e.target.value)}
                      sx={{ mb: 1.5 }}
                      size="small"
                      required
                    />
                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                      <SelectorPais
                        value={codigoPais}
                        onChange={setCodigoPais}
                      />
                      <TextField
                        fullWidth
                        label="Teléfono de contacto"
                        value={telefonoContacto}
                        onChange={e => setTelefonoContacto(e.target.value)}
                        placeholder="Ej: 912345678"
                        type="tel"
                      />
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 240,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: 1.5,
                    }}
                  >
                    <Typography
                      sx={{
                        mb: 0.5,
                        fontWeight: 500,
                        textAlign: 'center',
                        fontSize: 14,
                      }}
                    >
                      Sube la imagen con el logo de tu empresa
                    </Typography>
                    <Box
                      sx={{
                        width: 140,
                        height: 140,
                        border: '2px dashed #41B6E6',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 0.5,
                        bgcolor: theme =>
                          theme.palette.mode === 'dark' ? '#23272f' : '#f5f5f5',
                        overflow: 'hidden',
                        padding: 1.5,
                      }}
                    >
                      {logoEmpresa ? (
                        <img
                          src={logoEmpresa}
                          alt="Logo empresa"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <InsertPhotoIcon
                          sx={{
                            fontSize: 80,
                            color: '#41B6E6',
                            opacity: 0.7,
                          }}
                        />
                      )}
                    </Box>
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: 14,
                        borderColor: '#41B6E6',
                        color: '#1976d2',
                        mb: 0.5,
                        px: 2,
                        py: 0.5,
                        '&:hover': { borderColor: '#1976d2', color: '#1976d2' },
                      }}
                    >
                      Cargar Imagen
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                    </Button>
                    {logoError && (
                      <Typography
                        sx={{
                          color: 'red',
                          fontSize: 12,
                          mb: 0.5,
                          textAlign: 'center',
                        }}
                      >
                        {logoError}
                      </Typography>
                    )}
                    <Typography
                      sx={{ fontSize: 11, color: '#888', textAlign: 'center' }}
                    >
                      Tamaño máximo del archivo: 300 KB.
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  <TextField
                    label="Nombre y Apellido"
                    variant="outlined"
                    fullWidth
                    value={nombrePersonal}
                    onChange={e => setNombrePersonal(e.target.value)}
                    sx={{ mb: 1.5 }}
                    size="small"
                    required
                  />
                  <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                    <SelectorPais value={codigoPais} onChange={setCodigoPais} />
                    <TextField
                      fullWidth
                      label="Teléfono de contacto"
                      value={telefonoContacto}
                      onChange={e => setTelefonoContacto(e.target.value)}
                      placeholder="Ej: 912345678"
                      type="tel"
                    />
                  </Box>
                </>
              )}
            </Box>
            <Box sx={{ width: '100%', maxWidth: 400 }}>
              <Button
                variant="contained"
                onClick={() => setPaso(4)}
                sx={{
                  backgroundColor: '#41B6E6',
                  color: '#fff',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: 16,
                  width: '100%',
                  height: 42,
                  boxShadow: 'none',
                  mb: 0.5,
                  '&:hover': { backgroundColor: '#2fa4d6' },
                }}
              >
                Continuar
              </Button>
              <Button
                variant="text"
                onClick={() => setPaso(2)}
                sx={{
                  color: '#1976d2',
                  fontWeight: 700,
                  fontSize: 14,
                  width: '100%',
                  mt: 0.5,
                }}
              >
                Volver atrás
              </Button>
            </Box>
          </Box>
        )}

        {/* Paso 4: Confirmación de cuenta creada */}
        {paso === 4 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight={300}
          >
            <Typography
              variant="h5"
              sx={{
                mb: 2,
                mt: 2,
                fontWeight: 700,
                textAlign: 'center',
                fontSize: 20,
              }}
            >
              Hemos enviado un código de verificación al correo:
            </Typography>
            <Typography
              sx={{
                mb: 2,
                textAlign: 'center',
                fontSize: 18,
                fontWeight: 700,
                color: '#000',
              }}
            >
              <strong>{correo}</strong>
            </Typography>
            <Typography sx={{ mb: 2, textAlign: 'center', fontSize: 14 }}>
              Ingresa el código de verificación que recibiste para activar tu
              cuenta.
            </Typography>

            {/* Timer */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  background: timer > 0 ? '#e3f4fd' : '#fde3e3',
                  color: timer > 0 ? '#1976d2' : '#d32f2f',
                  borderRadius: '20px',
                  px: 1.5,
                  py: 0.5,
                  fontWeight: 700,
                  fontSize: 14,
                  margin: '0 auto',
                  boxShadow:
                    timer > 0 ? '0 2px 8px #b6e0fa55' : '0 2px 8px #fbbbbb55',
                  gap: 0.5,
                  minWidth: 150,
                  justifyContent: 'center',
                }}
              >
                <AccessTimeIcon
                  sx={{ fontSize: 18, mr: 0.5, color: 'inherit' }}
                />
                {timer > 0 ? (
                  <span
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: 0.5,
                      fontSize: 12,
                    }}
                  >
                    Tiempo restante:&nbsp;
                    {Math.floor(timer / 60)
                      .toString()
                      .padStart(2, '0')}
                    :{(timer % 60).toString().padStart(2, '0')}
                  </span>
                ) : (
                  <span style={{ fontSize: 12 }}>El código ha expirado</span>
                )}
              </Box>
            </Box>

            {/* Inputs de código */}
            <Box display="flex" justifyContent="center" mb={1.5} mt={2}>
              {codigoVerificacion.map((valor, idx) => (
                <TextField
                  key={idx}
                  value={valor}
                  id={`codigo-verif-input-${idx}`}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if (!val && valor === '') return;
                    const nuevoCodigo = [...codigoVerificacion];
                    nuevoCodigo[idx] = val;
                    setCodigoVerificacion(nuevoCodigo);
                    if (val && idx < 4) {
                      const next = document.getElementById(
                        `codigo-verif-input-${idx + 1}`
                      );
                      if (next) next.focus();
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace') {
                      if (codigoVerificacion[idx] === '') {
                        if (idx > 0) {
                          const nuevoCodigo = [...codigoVerificacion];
                          nuevoCodigo[idx - 1] = '';
                          setCodigoVerificacion(nuevoCodigo);
                          const prev = document.getElementById(
                            `codigo-verif-input-${idx - 1}`
                          );
                          if (prev) prev.focus();
                          e.preventDefault();
                        }
                      }
                    } else if (e.key === 'Delete') {
                      if (codigoVerificacion[idx] !== '') {
                        const nuevoCodigo = [...codigoVerificacion];
                        nuevoCodigo[idx] = '';
                        setCodigoVerificacion(nuevoCodigo);
                        e.preventDefault();
                      } else if (idx < 4) {
                        const nuevoCodigo = [...codigoVerificacion];
                        nuevoCodigo[idx + 1] = '';
                        setCodigoVerificacion(nuevoCodigo);
                        const next = document.getElementById(
                          `codigo-verif-input-${idx + 1}`
                        );
                        if (next) next.focus();
                        e.preventDefault();
                      }
                    } else if (e.key === 'ArrowLeft' && idx > 0) {
                      const prev = document.getElementById(
                        `codigo-verif-input-${idx - 1}`
                      );
                      if (prev) prev.focus();
                      e.preventDefault();
                    } else if (e.key === 'ArrowRight' && idx < 4) {
                      const next = document.getElementById(
                        `codigo-verif-input-${idx + 1}`
                      );
                      if (next) next.focus();
                      e.preventDefault();
                    }
                  }}
                  onPaste={e => {
                    const paste = e.clipboardData
                      .getData('Text')
                      .replace(/[^0-9]/g, '');
                    if (paste.length > 0) {
                      const nuevoCodigo = [...codigoVerificacion];
                      for (let i = 0; i < 5; i++) {
                        nuevoCodigo[i] = paste[i] || '';
                      }
                      setCodigoVerificacion(nuevoCodigo);
                      const lastIdx = Math.min(paste.length - 1, 4);
                      setTimeout(() => {
                        const last = document.getElementById(
                          `codigo-verif-input-${lastIdx}`
                        );
                        if (last) last.focus();
                      }, 0);
                      e.preventDefault();
                    }
                  }}
                  inputProps={{
                    maxLength: 1,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    style: {
                      textAlign: 'center',
                      fontSize: 24,
                      color: theme.palette.text.primary,
                      background: 'transparent',
                      height: 44,
                      lineHeight: '44px',
                      padding: 0,
                      margin: 0,
                    },
                  }}
                  sx={{
                    width: 44,
                    height: 44,
                    mx: 0.5,
                    mt: 1.5,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '22px',
                      bgcolor: theme.palette.background.default,
                      borderColor:
                        theme.palette.mode === 'dark' ? '#aaa' : '#888',
                      height: 44,
                      padding: 0,
                    },
                    '& input': {
                      textAlign: 'center',
                      fontSize: 24,
                      height: 44,
                      lineHeight: '44px',
                      padding: 0,
                      margin: 0,
                      boxSizing: 'border-box',
                      verticalAlign: 'middle',
                      background: 'transparent',
                    },
                  }}
                  variant="outlined"
                />
              ))}
            </Box>

            <Button
              variant="text"
              sx={{ color: '#1976d2', fontWeight: 700, mb: 2, fontSize: 14 }}
              onClick={() => {
                setShowCodigoEnviado(false);
                setTimeout(() => setShowCodigoEnviado(true), 10);
                setCodigoEnviado(true);
                setTimer(300);
                clearInterval(timerRef.current);
                timerRef.current = setInterval(() => {
                  setTimer(prev => prev - 1);
                }, 1000);
              }}
            >
              Reenviar Código
            </Button>

            <Button
              variant="contained"
              sx={{
                backgroundColor: codigoVerificacion.every(c => c.length === 1)
                  ? '#41B6E6'
                  : '#b0c4cc',
                color: '#fff',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 16,
                width: 220,
                height: 44,
                mb: 3,
                mt: 1,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: codigoVerificacion.every(c => c.length === 1)
                    ? '#2fa4d6'
                    : '#b0c4cc',
                },
              }}
              disabled={!codigoVerificacion.every(c => c.length === 1)}
              onClick={() => setPaso(5)}
            >
              Verificar Código
            </Button>

            <Button
              variant="text"
              onClick={handleVolverPaso4}
              sx={{
                color: '#888',
                fontWeight: 600,
                fontSize: 14,
                textTransform: 'none',
                '&:hover': { color: '#1976d2', background: 'transparent' },
              }}
            >
              Volver atrás
            </Button>
            {showCodigoEnviado && (
              <Fade in={fadeIn} timeout={800} unmountOnExit>
                <Typography
                  sx={{
                    color: '#41B6E6',
                    fontWeight: 500,
                    mt: 1,
                    fontSize: 14,
                    transition: 'opacity 0.8s',
                    opacity: fadeIn ? 1 : 0,
                  }}
                >
                  El código ha sido reenviado a tu correo.
                </Typography>
              </Fade>
            )}
          </Box>
        )}

        {/* Paso 5: Cuenta creada con éxito */}
        {paso === 5 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight={300}
          >
            <Typography
              variant="h5"
              sx={{ mt: 6, fontWeight: 700, textAlign: 'center', fontSize: 22 }}
            >
              ¡Tu cuenta ha sido creada con éxito!
            </Typography>
            <Typography
              sx={{ mt: 2, textAlign: 'center', fontSize: 16, color: '#555' }}
            >
              Ahora puedes disfrutar de todos los beneficios de ser parte de
              SELLSI.
            </Typography>
            <Button
              variant="contained"
              onClick={onClose}
              startIcon={<StorefrontIcon />} // ✅ NUEVO: Icono de marketplace
              sx={{
                backgroundColor: '#41B6E6',
                color: '#fff',
                fontWeight: 700,
                fontSize: 18,
                px: 3,
                py: 1.2,
                width: 260,
                mb: 8,
                mt: 6,
                '&:hover': { backgroundColor: '#2fa4d6' },
              }}
            >
              Ir a Marketplace {/* ✅ CAMBIO: Texto actualizado */}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
