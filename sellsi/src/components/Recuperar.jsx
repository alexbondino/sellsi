import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function Recuperar({ onClose, mostrarCodigo, setMostrarCodigo }) {
  const theme = useTheme();
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState('');
  const [codigo, setCodigo] = useState(['', '', '', '', '']);
  const [mensaje, setMensaje] = useState('');
  const [timer, setTimer] = useState(300); // 5 minutos en segundos
  const timerRef = useRef();

  // Cuando se muestra el modal de código, inicia el timer
  useEffect(() => {
    if (mostrarCodigo) {
      setTimer(300);
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [mostrarCodigo]);

  // Si el timer llega a 0, lo detenemos
  useEffect(() => {
    if (timer === 0) {
      clearInterval(timerRef.current);
    }
  }, [timer]);

  // Validación simple de correo: x@x.x
  const correoValido = /^[^@]+@[^@]+\.[^@]+$/;

  const handleBuscar = (e) => {
    e.preventDefault();
    if (!correo) {
      setError('Por favor, rellena este campo.');
      return;
    }
    if (!correoValido.test(correo)) {
      setError('Correo inválido. Ejemplo: usuario@dominio.com');
      return;
    }
    setError('');
    setMensaje('Revisa el código que fue enviado a tu correo.');
    setMostrarCodigo(true);
  };

  const handleCodigoChange = (idx, value) => {
    if (!/^[0-9]?$/.test(value)) return; // Solo números y máximo 1 dígito
    const nuevoCodigo = [...codigo];
    nuevoCodigo[idx] = value;
    setCodigo(nuevoCodigo);
    // Auto-focus al siguiente input
    if (value && idx < 4) {
      const next = document.getElementById(`codigo-input-${idx + 1}`);
      if (next) next.focus();
    }
  };

  const codigoCompleto = codigo.every((c) => c.length === 1);

  return (
    <Box sx={{ 
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: 400,
          maxWidth: '98%',
          position: 'relative',
          bgcolor: theme.palette.background.paper,
          overflow: 'hidden'
        }}
      >
        <Button
          onClick={() => {
            // Reinicia el estado al cerrar
            setMostrarCodigo(false);
            // Cierra el modal
            onClose();
          }}
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
        {/* --- MODAL CORREO --- */}
        {!mostrarCodigo ? (
          <>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Recupera tu cuenta
            </Typography>
            <Typography sx={{ mb: 2 }}>
              Ingresa tu correo electrónico y te enviaremos un código de recuperación.
            </Typography>
            {mensaje && (
              <Typography sx={{ mb: 2, color: '#41B6E6', fontWeight: 500 }}>
                {mensaje}
              </Typography>
            )}
            <form onSubmit={handleBuscar}>
              <TextField
                label="Correo electrónico"
                variant="outlined"
                fullWidth
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
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
                error={!!error}
                helperText={error}
              />
              <Box display="flex" justifyContent="space-between" gap={2} mt={2}>
                <Button
                  variant="contained"
                  onClick={onClose}
                  sx={{
                    backgroundColor: '#e4e6eb',
                    color: '#050505',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 400,
                    px: 4,
                    fontSize: 18,
                    boxShadow: 'none',
                    width: '50%',
                    height: 55,
                    '&:hover': { backgroundColor: '#d8dadf' },
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    backgroundColor: '#41B6E6',
                    color: '#fff',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 400,
                    px: 2,
                    fontSize: 18,
                    boxShadow: 'none',
                    width: '50%',
                    height: 55,
                    '&:hover': { backgroundColor: '#2fa4d6' },
                  }}
                >
                  Enviar Código
                </Button>
              </Box>
            </form>
          </>
        ) : (
          /* --- MODAL CODIGO RECUP --- */
          <Box display="flex" flexDirection="column" alignItems="center">
            <img src="/candado.png" alt="candado" style={{ width: 90, marginBottom: 16 }} />
            <Typography align="center" sx={{ mb: 2, mt: 1 }}>
              Hemos enviado un código de verificación a <strong>{correo}</strong>.<br />
              Introduce el código en las casillas inferiores.
            </Typography>
            <Box display="flex" justifyContent="center" mb={2}>
              {codigo.map((valor, idx) => (
                <TextField
                  key={idx}
                  id={`codigo-input-${idx}`}
                  value={valor}
                  onChange={(e) => handleCodigoChange(idx, e.target.value)}
                  inputProps={{
                    maxLength: 1,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    style: {
                      textAlign: 'center',
                      fontSize: 32,
                      padding: 0,
                      color: theme.palette.text.primary,
                      background: 'transparent',
                    },
                  }}
                  sx={{
                    width: 56,
                    height: 56,
                    mx: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '28px',
                      bgcolor: theme.palette.background.default,
                      borderColor: theme.palette.mode === 'dark' ? '#aaa' : '#888',
                    },
                  }}
                  variant="outlined"
                />
              ))}
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  background: timer > 0 ? '#e3f4fd' : '#fde3e3',
                  color: timer > 0 ? '#1976d2' : '#d32f2f',
                  borderRadius: '24px',
                  px: 2,
                  py: 1,
                  fontWeight: 700,
                  fontSize: 18,
                  boxShadow: timer > 0 ? '0 2px 8px #b6e0fa55' : '0 2px 8px #fbbbbb55',
                  gap: 1,
                  minWidth: 170,
                  justifyContent: 'center',
                }}
              >
                <AccessTimeIcon sx={{ fontSize: 22, mr: 1, color: 'inherit' }} />
                {timer > 0 ? (
                  <>
                    Tiempo restante:&nbsp;
                    <span style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: 1 }}>
                      {Math.floor(timer / 60).toString().padStart(2, '0')}
                      :{(timer % 60).toString().padStart(2, '0')}
                    </span>
                  </>
                ) : (
                  <>El código ha expirado</>
                )}
              </Box>
            </Box>
            <Button
              variant="contained"
              disabled={!codigoCompleto}
              sx={{
                backgroundColor: codigoCompleto ? '#41B6E6' : '#b0c4cc',
                color: '#fff',
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 20,
                width: 260,
                height: 56,
                mb: 2,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: codigoCompleto ? '#2fa4d6' : '#b0c4cc',
                },
              }}
            >
              Verificar Código
            </Button>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ¿No has recibido el codigo?
            </Typography>
            <Button
              variant="text"
              sx={{ color: '#1976d2', fontWeight: 700, mb: 2, fontSize: 16 }}
              onClick={() => {
                setTimer(300);
                setMensaje('El código fue reenviado a tu correo.');
                // Aquí deberías llamar a tu función real de reenvío si tienes backend
              }}
            >
              Reenviar Código
            </Button>
            <Button
              variant="contained"
              onClick={() => setMostrarCodigo(false)}
              sx={{
                backgroundColor: '#e4e6eb',
                color: '#757575',
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 20,
                width: 160,
                height: 56,
                boxShadow: 'none',
                '&:hover': { backgroundColor: '#d8dadf' },
              }}
            >
              Volver atras
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}