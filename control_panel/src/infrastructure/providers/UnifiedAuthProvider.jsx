// Stub de UnifiedAuthProvider para admin
// El admin usa su propio sistema de autenticación
import { createContext, useContext } from 'react';

const AuthContext = createContext(null);

// Hooks stubs
export const useAuth = () => {
  return {
    user: null,
    loading: false,
  };
};

export const useRole = () => {
  return {
    role: null,
    isAdmin: false,
    isSupplier: false,
    isBuyer: false,
  };
};

export const UnifiedAuthProvider = ({ children }) => {
  return children;
};

export default UnifiedAuthProvider;
