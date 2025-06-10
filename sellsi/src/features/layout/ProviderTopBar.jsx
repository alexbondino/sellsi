import React from 'react';
import { useNavigate } from 'react-router-dom';
import BaseTopBar from './BaseTopBar';

/**
 * ProviderTopBar - Configuración específica para páginas de Proveedor
 * - Sin botones de navegación (Quiénes Somos, Servicios, etc.)
 * - Usa la imagen del proveedor desde useSupplierLogo si está disponible
 * - Solo muestra perfil del usuario logueado
 */
export default function ProviderTopBar() {
  const navigate = useNavigate();

  // Handlers específicos para Provider
  const handleGoToProfile = () => {
    console.log('Navegando a perfil del proveedor');
    // TODO: Implementar navegación al perfil del proveedor
    // navigate('/supplier/profile')
  };

  // Sin botones de navegación para Provider dashboard
  const navigationButtons = [];

  // Configuración para botones de autenticación - solo se mostrarán si no está logueado
  // Pero en el dashboard del proveedor, el usuario ya debería estar logueado
  const authButtons = {};

  return (
    <BaseTopBar
      navigationButtons={navigationButtons}
      authButtons={authButtons}
      onNavigate={null} // No hay navegación interna
      showContactModal={false} // No mostrar modal de contacto en dashboard del proveedor
    />
  );
}
