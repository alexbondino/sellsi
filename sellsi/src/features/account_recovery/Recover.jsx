import React, { useImperativeHandle, forwardRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ AGREGAR
import { Box, Paper, Dialog, DialogContent } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { PrimaryButton, useRecuperarForm } from '../landing_page/hooks';
import Step1Email from './wizard/Step1Email'; // Componente para ingresar correo
import Step2Code from './wizard/Step2Code'; // Componente para verificar código
import Step3Reset from './wizard/Step3Reset'; // Componente para restablecer contraseña
import Step4Success from './wizard/Step4Success'; // Componente de éxito

const Recuperar = forwardRef(function Recuperar(props, ref) {
  const theme = useTheme();
  const location = useLocation(); // ✅ AGREGAR
  const {
    // Estados
    paso,
    correo,
    error,
    mensaje,
    codigo,
    timer,
    nuevaContrasena,
    repiteContrasena,
    showPassword,
    showRepeatPassword,
    showCodigoEnviado,
    fadeIn,

    // Setters
    setPaso, // ✅ AGREGAR ESTE SETTER
    setCorreo,
    setCodigo,
    setNuevaContrasena,
    setRepiteContrasena,
    setShowPassword,
    setShowRepeatPassword,

    // Métodos
    resetAllStates,
    handleBuscar,
    handleVerificarCodigo,
    handleCambiarContrasena,
    handleResendCode,
  } = useRecuperarForm();

  useImperativeHandle(ref, () => resetAllStates);
  const handleCerrarTotal = () => {
    resetAllStates(); // ✅ RESETEAR ESTADOS ANTES DE CERRAR
    props.onClose();
  };

  // ✅ CERRAR MODAL EN NAVEGACIÓN
  useEffect(() => {
    const handleCloseAllModals = () => {
      if (props.onClose) {
        props.onClose();
      }
    };

    window.addEventListener('closeAllModals', handleCloseAllModals);

    return () => {
      window.removeEventListener('closeAllModals', handleCloseAllModals);
    };
  }, [props.onClose]);

  // ✅ CERRAR al cambiar de ruta
  // useEffect(() => {
  //   if (props.onClose) {
  //     props.onClose()
  //   }
  // }, [location.pathname, props.onClose])

  return (
    <Box
      sx={{
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: 400,
          maxWidth: '100%',
          position: 'relative',
          bgcolor: theme.palette.background.paper,
          overflow: 'hidden',
          borderRadius: 2,
        }}
      >
        {/* Botón cerrar */}
        {paso !== 'exito' && (
          <PrimaryButton
            variant="text"
            onClick={handleCerrarTotal}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              fontSize: 16,
              textTransform: 'uppercase',
              minWidth: 'auto',
              padding: '4px 8px',
              '&:hover': {
                backgroundColor: 'rgba(65, 182, 230, 0.08)',
              },
            }}
          >
            CERRAR
          </PrimaryButton>
        )}
        {/* Renderizado condicional de pasos */}
        {paso === 'correo' && (
          <Step1Email
            correo={correo}
            setCorreo={setCorreo}
            error={error}
            mensaje={mensaje}
            onSubmit={handleBuscar}
            onCancel={handleCerrarTotal}
          />
        )}
        {paso === 'codigo' && (
          <Step2Code
            correo={correo}
            codigo={codigo}
            setCodigo={setCodigo}
            timer={timer}
            onVerify={handleVerificarCodigo}
            onResendCode={handleResendCode}
            onBack={() => setPaso('correo')} // ✅ USAR setPaso CORRECTO
            showCodigoEnviado={showCodigoEnviado}
            fadeIn={fadeIn}
          />
        )}{' '}
        {paso === 'restablecer' && (
          <Step3Reset
            nuevaContrasena={nuevaContrasena}
            setNuevaContrasena={setNuevaContrasena}
            repiteContrasena={repiteContrasena}
            setRepiteContrasena={setRepiteContrasena}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showRepeatPassword={showRepeatPassword}
            setShowRepeatPassword={setShowRepeatPassword}
            onSubmit={handleCambiarContrasena}
            onBack={() => setPaso('codigo')}
          />
        )}
        {paso === 'exito' && <Step4Success onClose={props.onVolverLogin} />}
      </Paper>
    </Box>
  );
});

export default Recuperar;
