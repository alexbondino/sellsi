import React, { Suspense } from 'react';

// Lazy imports (mantener mismas rutas para no cambiar behavior)
// Este archivo está un nivel más profundo que TopBar.jsx, por lo que se requiere un '../' adicional
const Login = React.lazy(() =>
  import('../../../../../auth/login/components/Login')
);
const Register = React.lazy(() =>
  import('../../../../../domains/auth/components/Register')
);

/**
 * AuthModals - wrapper para modales de autenticación.
 * Props:
 *  - openLogin: boolean
 *  - openRegister: boolean
 *  - onCloseLogin: () => void
 *  - onCloseRegister: () => void
 *  - onLoginToRegister: () => void (transición)
 */
export function AuthModals({
  openLogin,
  openRegister,
  onCloseLogin,
  onCloseRegister,
  onLoginToRegister,
}) {
  return (
    <>
      {openLogin && (
        <Suspense fallback={null}>
          <Login
            open={openLogin}
            onClose={onCloseLogin}
            onOpenRegister={onLoginToRegister}
          />
        </Suspense>
      )}
      {openRegister && (
        <Suspense fallback={null}>
          <Register open={openRegister} onClose={onCloseRegister} />
        </Suspense>
      )}
    </>
  );
}
