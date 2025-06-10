import React from 'react';
import BaseTopBar from './BaseTopBar';

/**
 * TopBar - Configuración específica para la página Home
 * Utiliza BaseTopBar con configuración completa de navegación
 */
export default function TopBar({ onNavigate }) {
  // Configuración de botones de navegación para Home
  const navigationButtons = [
    { label: 'Quiénes somos', ref: 'quienesSomosRef' },
    { label: 'Servicios', ref: 'serviciosRef' },
    { label: 'Trabaja con Nosotros', ref: 'trabajaConNosotrosRef' },
    { label: 'Contáctanos', ref: 'contactModal' },
  ];

  // Configuración de botones de autenticación (usa defaults)
  const authButtons = {};
  return (
    <BaseTopBar
      navigationButtons={navigationButtons}
      authButtons={authButtons}
      onNavigate={onNavigate}
      showContactModal={true}
      logoMarginLeft={{
        xs: 0,
        sm: 0,
        md: -2,
        lg: -20,
        xl: -42,
      }}
    />
  );
}
