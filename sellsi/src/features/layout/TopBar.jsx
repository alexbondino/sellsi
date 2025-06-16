import React from 'react';
import BaseTopBar from './BaseTopBar';

/**
 * TopBar - Un componente inteligente que adapta su contenido
 * basado en el estado de la sesión del usuario.
 */
export default function TopBar({ onNavigate, session }) {
  // Lógica condicional para los botones de navegación.
  // Si existe una sesión de usuario, el array estará vacío.
  // Si no hay sesión, se mostrarán los enlaces para visitantes.
  const navigationButtons = session
    ? []
    : [
        { label: 'Quiénes somos', ref: 'quienesSomosRef' },
        { label: 'Servicios', ref: 'serviciosRef' },
        { label: 'Trabaja con Nosotros', ref: 'trabajaConNosotrosRef' },
        { label: 'Contáctanos', ref: 'contactModal' },
      ];

  // La configuración de los botones de autenticación se mantiene,
  // probablemente BaseTopBar ya los muestra/oculta según la sesión.
  const authButtons = {};

  return (
    <BaseTopBar
      navigationButtons={navigationButtons}
      authButtons={authButtons}
      onNavigate={onNavigate}
      showContactModal={!session} // Opcional: Ocultar también el modal de contacto si hay sesión
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
