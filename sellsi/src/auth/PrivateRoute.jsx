import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Ruta protegida para proveedores autenticados.
 * Verifica si existe un supplierId en localStorage.
 */
const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('proveedorId');

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
