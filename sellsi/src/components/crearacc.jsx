import React, { useState } from 'react';
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
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Barra de progreso superior
function BarraProgreso({ paso }) {
  const theme = useTheme();
  const gris = '#b0b0b0';
  const celeste = '#41B6E6'; 
  const textoColor = theme.palette.mode === 'dark' ? '#fff' : '#222';

  // Ya no necesitamos amarillo
  // const amarillo = '#FFD600';
  
  // Colores de los círculos según el paso
  const getCirculoEstilo = (index) => {
    const circuloPaso = index + 1;
    
    if (circuloPaso < paso) {
      // Paso completado - todo celeste
      return {
        background: celeste
      };
    } else if (circuloPaso === paso) {
      // Paso actual - mitad celeste, mitad gris
      // Excepción: si estamos en el último paso, el círculo debe estar completamente celeste
      if (paso === 4 && circuloPaso === 4) {
        return {
          background: celeste
        };
      } else {
        return {
          background: `linear-gradient(to right, ${celeste} 50%, ${gris} 50%)`
        };
      }
    } else {
      // Paso futuro - todo gris
      return {
        background: gris
      };
    }
  };

  // Colores de las barras según el paso (ahora 3 segmentos)
  const barra1Color = paso > 1 ? celeste : gris;
  const barra2Color = paso > 2 ? celeste : gris;
  const barra3Color = paso > 3 ? celeste : gris;

  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
        mt: 4,
        mb: 6,
        px: '8%',
        height: 100,
      }}
    >
      {/* Barra de progreso */}
      <Box
        sx={{
          position: 'absolute',
          top: 34,
          left: 'calc(8% + 32px)',
          right: 'calc(8% + 32px)',
          height: 8,
          zIndex: 0,
          display: 'flex',
        }}
      >
        {/* Primera barra */}
        <Box sx={{
          width: '33.3%',
          height: '100%',
          background: barra1Color,
          borderRadius: 4,
          transition: 'background 0.3s',
          mr: '2px'
        }} />
        {/* Segunda barra */}
        <Box sx={{
          width: '33.3%',
          height: '100%',
          background: barra2Color,
          borderRadius: 4,
          transition: 'background 0.3s',
          mx: '2px'
        }} />
        {/* Tercera barra */}
        <Box sx={{
          width: '33.3%',
          height: '100%',
          background: barra3Color,
          borderRadius: 4,
          transition: 'background 0.3s',
          ml: '2px'
        }} />
      </Box>

      {/* Círculos y textos */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 1,
          px: 0,
        }}
      >
        {[
          { text: 'Creación\nde Cuenta' },
          { text: 'Tipo de\nCuenta' },
          { text: 'Completar\nInformación' },
          { text: 'Cuenta\nCreada' }
        ].map((item, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                ...getCirculoEstilo(index),
                mb: 1,
                zIndex: 2,
                fontWeight: 700,
                fontSize: 22,
                color: '#222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.3s'
              }}
            >
              {/* <span style={{ color: '#222', fontWeight: 700 }}>{index + 1}</span> */}
            </Box>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 500,
                color: textoColor,
                textAlign: 'center',
                whiteSpace: 'pre-line'
              }}
            >
              {item.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function CrearAcc({ onClose }) {
  const theme = useTheme();
  const [paso, setPaso] = useState(1);

  // Estado para crearcuen1
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaComunicaciones, setAceptaComunicaciones] = useState(false);
  const [tipoCuenta, setTipoCuenta] = useState('');
  const [logoEmpresa, setLogoEmpresa] = useState(null);
  const [logoError, setLogoError] = useState('');

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 300 * 1024) {
        setLogoError('El tamaño del archivo excede los 300 KB.');
        setLogoEmpresa(null);
        return;
      }
      setLogoError('');
      const reader = new FileReader();
      reader.onload = (ev) => setLogoEmpresa(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Validaciones de contraseña
  const requisitos = [
    { label: 'Al menos 8 caracteres', valid: contrasena.length >= 8 },
    { label: 'Letras minúsculas (a-z)', valid: /[a-z]/.test(contrasena) },
    { label: 'Letras mayúsculas (A-Z)', valid: /[A-Z]/.test(contrasena) },
    { label: 'Números (0-9)', valid: /\d/.test(contrasena) },
    { label: 'Caracteres especiales (ej: !@#$%^&*)', valid: /[!@#$%^&*]/.test(contrasena) },
  ];
  // Solo cuenta los requisitos de minúscula, mayúscula, número, especial
  const requisitosValidos = [
    requisitos[1].valid,
    requisitos[2].valid,
    requisitos[3].valid,
    requisitos[4].valid,
  ].filter(Boolean).length;
  const cumpleMinimos = contrasena.length >= 8 && requisitosValidos >= 3;

  // Validación de correo electrónico
  const correoValido = /^[^@]+@[^@]+\.[^@]+$/;
  const correoEsValido = correoValido.test(correo);

  return (
    <Box sx={{ 
      overflow: 'hidden', // Previene scrollbars
      display: 'flex',
      justifyContent: 'center'
    }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: 920,
          minHeight: 750,
          maxWidth: '98%',
          position: 'relative',
          bgcolor: theme.palette.background.paper,
          overflow: 'hidden' // También previene scrollbars en el Paper
        }}
      >
        {/* Botón cerrar */}
        <Button
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: '#41B6E6',
            fontWeight: 700,
            fontSize: 16,
            textTransform: 'uppercase',
          }}
        >
          CERRAR
        </Button>

        {/* Barra de progreso */}
        <BarraProgreso paso={paso} />

        {/* Paso 1: Registro */}
        {paso === 1 && (
          <>
            <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
              <img
                src={theme.palette.mode === 'dark' ? '/logodarkmode.jpeg' : '/LOGO-removebg-preview.png'}
                alt="SELLSI Logo"
                style={{ width: 220, marginBottom: 10 }}
              />
              <Typography
                variant="h6"
                align="center"
                sx={{
                  mb: 1,
                  color: theme.palette.mode === 'dark' ? '#fff' : '#222',
                  fontWeight: 700,
                  fontSize: 22,
                  fontStyle: 'italic',
                }}
              >
                Conecta. Vende. Crece
              </Typography>
            </Box>
            <form onSubmit={e => { e.preventDefault(); setPaso(2); }}>
              <TextField
                label="Correo electrónico"
                variant="outlined"
                fullWidth
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                sx={{ mb: 2 }}
                error={correo.length > 0 && !correoEsValido}
                helperText={correo.length > 0 && !correoEsValido ? 'Correo inválido. Ejemplo: usuario@dominio.com' : ''}
              />
              <TextField
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                fullWidth
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((show) => !show)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    height: 48,
                    fontSize: 18,
                    px: 1.5,
                  },
                }}
                inputProps={{
                  lang: 'es',
                  style: { height: 30 },
                }}
              />
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  background: theme.palette.background.default,
                  fontSize: 15,
                }}
              >
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  Tu contraseña debe contener:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li style={{ color: requisitos[0].valid ? 'green' : undefined }}>
                    {requisitos[0].valid ? '✓' : '•'} Al menos 8 caracteres
                  </li>
                  <li>
                    Al menos 3 de los siguientes:
                    <ul>
                      <li style={{ color: requisitos[1].valid ? 'green' : undefined }}>
                        {requisitos[1].valid ? '✓' : '•'} Letras minúsculas (a-z)
                      </li>
                      <li style={{ color: requisitos[2].valid ? 'green' : undefined }}>
                        {requisitos[2].valid ? '✓' : '•'} Letras mayúsculas (A-Z)
                      </li>
                      <li style={{ color: requisitos[3].valid ? 'green' : undefined }}>
                        {requisitos[3].valid ? '✓' : '•'} Números (0-9)
                      </li>
                      <li style={{ color: requisitos[4].valid ? 'green' : undefined }}>
                        {requisitos[4].valid ? '✓' : '•'} Caracteres especiales (ej: !@#$%^&*)
                      </li>
                    </ul>
                  </li>
                </ul>
              </Paper>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={aceptaTerminos}
                    onChange={(e) => setAceptaTerminos(e.target.checked)}
                    sx={{ color: '#41B6E6' }}
                  />
                }
                label={
                  <span>
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
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={aceptaComunicaciones}
                    onChange={(e) => setAceptaComunicaciones(e.target.checked)}
                    sx={{ color: '#41B6E6' }}
                  />
                }
                label="Acepto recibir avisos de ofertas y novedades de SELLSI."
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={!cumpleMinimos || !aceptaTerminos || !correoEsValido}
                sx={{
                  backgroundColor: cumpleMinimos && aceptaTerminos && correoEsValido ? '#41B6E6' : '#b0c4cc',
                  color: '#fff',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: 20,
                  width: '100%',
                  height: 56,
                  boxShadow: 'none',
                  mb: 1,
                  '&:hover': {
                    backgroundColor: cumpleMinimos && aceptaTerminos && correoEsValido ? '#2fa4d6' : '#b0c4cc',
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
                  fontSize: 16,
                  width: '100%',
                  mt: 1,
                }}
              >
                Volver atrás
              </Button>
            </form>
          </>
        )}

        {/* Paso 2: Selección de tipo de cuenta */}
        {paso === 2 && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={350}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
              Elige el tipo de cuenta predeterminado
            </Typography>
            <Box display="flex" gap={4} width="100%" justifyContent="center" flexWrap="wrap">
              {/* Cuenta Proveedor */}
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  minWidth: 308,
                  maxWidth: 374,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: 352,
                  border: tipoCuenta === 'proveedor'
                    ? `2px solid #41B6E6`
                    : `2px solid ${theme.palette.mode === 'dark' ? '#444' : '#eee'}`,
                  background: tipoCuenta === 'proveedor'
                    ? (theme.palette.mode === 'dark' ? '#18324a' : '#f0fbff')
                    : (theme.palette.mode === 'dark' ? '#23272f' : '#fafbfc'),
                  transition: 'border 0.2s, background 0.2s',
                }}
              >
                <Box flexGrow={1} width="100%">
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      color: theme.palette.mode === 'dark' ? '#fff' : '#222',
                    }}
                  >
                    Cuenta Proveedor
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
                    Regístrate como proveedor para:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 18, color: theme.palette.mode === 'dark' ? '#ccc' : '#444', fontSize: 15 }}>
                    <li>Crear el perfil de tu empresa y promocionar tus productos</li>
                    <li>Recibir solicitudes de compradores</li>
                    <li>Acceder a una base de datos de compradores</li>
                    <li>Ofrecer productos a leads de compradores</li>
                    <li>Comerciar carga no reclamada</li>
                  </ul>
                </Box>
                <Button
                  sx={{
                    width: '100%',
                    backgroundColor: tipoCuenta === 'proveedor' ? '#41B6E6' : '#b0c4cc',
                    color: '#fff',
                    fontWeight: 700,
                    textTransform: 'none',
                    mt: 2,
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
                  p: 3,
                  minWidth: 308,
                  maxWidth: 374,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: 352,
                  border: tipoCuenta === 'comprador'
                    ? `2px solid #41B6E6`
                    : `2px solid ${theme.palette.mode === 'dark' ? '#444' : '#eee'}`,
                  background: tipoCuenta === 'comprador'
                    ? (theme.palette.mode === 'dark' ? '#18324a' : '#f0fbff')
                    : (theme.palette.mode === 'dark' ? '#23272f' : '#fafbfc'),
                  transition: 'border 0.2s, background 0.2s',
                }}
              >
                <Box flexGrow={1} width="100%">
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      color: theme.palette.mode === 'dark' ? '#fff' : '#222',
                    }}
                  >
                    Cuenta Comprador
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
                    Regístrate como comprador para:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 18, color: theme.palette.mode === 'dark' ? '#ccc' : '#444', fontSize: 15 }}>
                    <li>Buscar productos y solicitar cotizaciones a proveedores</li>
                    <li>Crear solicitudes para que proveedores te contacten</li>
                    <li>Acceder a carga no reclamada</li>
                  </ul>
                </Box>
                <Button
                  variant="contained"
                  sx={{
                    width: '100%',
                    backgroundColor: tipoCuenta === 'comprador' ? '#41B6E6' : '#b0c4cc',
                    color: '#fff',
                    fontWeight: 700,
                    textTransform: 'none',
                    mt: 2,
                    '&:hover': { backgroundColor: '#2fa4d6' },
                  }}
                  onClick={() => setTipoCuenta('comprador')}
                >
                  Elegir
                </Button>
              </Paper>
            </Box>
            {/* SEPARADOR GRANDE */}
            <Box mt={10} display="flex" flexDirection="column" alignItems="center" width="100%">
              <Typography sx={{ color: '#888', fontSize: 14, mb: 3, textAlign: 'center' }}>
                *Podrás cambiar el tipo de cuenta más adelante desde la configuración de tu perfil.
              </Typography>
              <Button
                variant="contained"
                disabled={!tipoCuenta}
                onClick={() => setPaso(3)}
                sx={{
                  width: 300,
                  backgroundColor: tipoCuenta ? '#41B6E6' : '#b0c4cc',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 22,
                  mb: 2,
                  textTransform: 'none',
                  boxShadow: '0 4px 10px 0 rgba(0,0,0,0.10)',
                  height: 56,
                  '&:hover': { backgroundColor: tipoCuenta ? '#2fa4d6' : '#b0c4cc' },
                }}
              >
                Continuar
              </Button>
              <Button
                variant="text"
                onClick={() => setPaso(3)}
                sx={{
                  color: '#1976d2',
                  fontWeight: 700,
                  fontSize: 18,
                  mt: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                SALTAR ESTE PASO
              </Button>
            </Box>
          </Box>
        )}

        {/* Paso 3: Placeholder */}
        {paso === 3 && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={350}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
              {tipoCuenta === 'proveedor'
                ? 'Completa los datos de tu empresa'
                : 'Completa tus datos personales'}
            </Typography>
            <Box
              component="form"
              sx={{
                width: '100%',
                maxWidth: tipoCuenta === 'proveedor' ? 900 : 400,
                display: 'flex',
                flexDirection: tipoCuenta === 'proveedor' ? 'row' : 'column',
                gap: 4,
                justifyContent: 'center',
                alignItems: 'flex-start',
                mb: 4,
              }}
              noValidate
              autoComplete="off"
            >
              {tipoCuenta === 'proveedor' ? (
                <>
                  {/* Formulario empresa */}
                  <Box sx={{ flex: 1, minWidth: 320 }}>
                    <TextField
                      label="Razón Social"
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 2 }}
                      required
                    />
                    <TextField
                      label="Nombre de Empresa"
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 2 }}
                      required
                    />
                    <TextField
                      label="RUT Empresa"
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 2 }}
                      required
                    />
                    <TextField
                      label="Teléfono de contacto (opcional)"
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  {/* Logo empresa */}
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 260,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: 2,
                    }}
                  >
                    <Typography sx={{ mb: 1, fontWeight: 500, textAlign: 'center' }}>
                      Sube la imagen con el logo de tu empresa
                    </Typography>
                    {/* Contenedor de la imagen */}
                    <Box
                      sx={{
                        width: 180,
                        height: 180,
                        border: '2px dashed #41B6E6',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                        bgcolor: theme => theme.palette.mode === 'dark' ? '#23272f' : '#f5f5f5',
                        overflow: 'hidden',
                        padding: 2, // Agregamos padding para imágenes pequeñas como imageicon.png
                      }}
                    >
                      <img
                        src={logoEmpresa || '/imageicon.png'}
                        alt="Logo empresa"
                        style={{ 
                          maxWidth: '100%',  
                          maxHeight: '100%',
                          width: 'auto',     // Cambiamos de width: 100% a auto
                          height: 'auto',    // Cambiamos de height: 100% a auto
                          objectFit: 'contain' 
                        }}
                      />
                    </Box>
                    <Button
                      variant="outlined"
                      component="label"
                      sx={{
                        fontWeight: 700,
                        fontSize: 18,
                        borderColor: '#41B6E6',
                        color: '#1976d2',
                        mb: 1,
                        px: 3,
                        py: 1,
                        '&:hover': { borderColor: '#1976d2', color: '#1976d2' }
                      }}
                    >
                      Cargar Imagen
                      <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
                    </Button>
                    {logoError && (
                      <Typography sx={{ color: 'red', fontSize: 14, mb: 1, textAlign: 'center' }}>
                        {logoError}
                      </Typography>
                    )}
                    <Typography sx={{ fontSize: 13, color: '#888', textAlign: 'center' }}>
                      Tamaño máximo del archivo: 300 KB.
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  {/* Formulario comprador */}
                  <TextField
                    label="Nombre y Apellido"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 2 }}
                    required
                  />
                  <TextField
                    label="RUT"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 2 }}
                    required
                  />
                  <TextField
                    label="Teléfono de contacto (opcional)"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                </>
              )}
            </Box>
            {/* Botones centrados */}
            <Box display="flex" width="100%" maxWidth={tipoCuenta === 'proveedor' ? 900 : 400} justifyContent="center" gap={4} mt={4}>
              <Button
                variant="outlined"
                onClick={() => setPaso(2)}
                sx={{
                  fontWeight: 700,
                  fontSize: tipoCuenta === 'comprador' ? 18 : 20, // Reducimos de 20 a 18 para comprador
                  px: tipoCuenta === 'comprador' ? 3 : 4,         // Reducimos el padding horizontal
                  py: tipoCuenta === 'comprador' ? 1.2 : 1.5,     // Reducimos el padding vertical
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': { borderColor: '#41B6E6', color: '#41B6E6' }
                }}
              >
                Volver Atrás
              </Button>
              <Button
                variant="contained"
                onClick={() => setPaso(4)} // Cambiado para ir al paso 4
                sx={{
                  fontWeight: 700,
                  fontSize: tipoCuenta === 'comprador' ? 18 : 20, // Reducimos de 20 a 18 para comprador
                  px: tipoCuenta === 'comprador' ? 3 : 4,         // Reducimos el padding horizontal
                  py: tipoCuenta === 'comprador' ? 1.2 : 1.5,     // Reducimos el padding vertical
                  backgroundColor: '#41B6E6',
                  color: '#fff',
                  '&:hover': { backgroundColor: '#2fa4d6' }
                }}
              >
                Continuar
              </Button>
            </Box>
          </Box>
        )}

        {/* Paso 4: Confirmación de cuenta creada */}
        {paso === 4 && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={350}>
            <Box sx={{ mb: 4 }}>
              {/* Ícono de confirmación/éxito */}
              <Box 
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  backgroundColor: '#41B6E6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 3
                }}
              >
                <Typography sx={{ color: 'white', fontSize: 60 }}>✓</Typography>
              </Box>
              
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
                ¡Tu cuenta ha sido creada con éxito!
              </Typography>
              
              <Typography sx={{ textAlign: 'center', mb: 3 }}>
                Hemos enviado un correo electrónico a <strong>{correo}</strong> con un enlace para verificar tu cuenta.
              </Typography>
              
              <Typography sx={{ textAlign: 'center', mb: 3 }}>
                Por favor, revisa tu bandeja de entrada y sigue las instrucciones para activar tu cuenta.
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              onClick={onClose}
              sx={{
                backgroundColor: '#41B6E6',
                color: '#fff',
                fontWeight: 700,
                fontSize: 20,
                px: 4,
                py: 1.5,
                width: 300,
                mb: 2,
                '&:hover': { backgroundColor: '#2fa4d6' }
              }}
            >
              Ir al inicio
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}