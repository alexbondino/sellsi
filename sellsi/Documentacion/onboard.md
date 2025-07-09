# Análisis y solución al problema de redirección automática a Onboarding tras registro

## Hipótesis del problema

- El flujo de registro y verificación de email funciona correctamente.
- Tras verificar el email, el usuario es redirigido a la home (`/`), pero **no se muestra automáticamente el onboarding** aunque el perfil esté incompleto.
- Esto ocurre porque la lógica de redirección a `/onboarding` solo se activa en rutas protegidas por `PrivateRoute`, no en la home ni rutas neutrales.

## Evidencia en el código

- En `App.jsx`, el estado `needsOnboarding` se calcula correctamente tras login/registro.
- Las rutas protegidas usan `PrivateRoute`, que redirige a `/onboarding` si corresponde.
- Sin embargo, si el usuario aterriza en `/` (home) tras la verificación, no hay ningún efecto que lo lleve automáticamente a `/onboarding`.

## Solución propuesta

- Agregar un efecto en `App.jsx` que, si el usuario está autenticado, `needsOnboarding` es true y la ruta actual es `/` (o cualquier ruta neutral), redirija automáticamente a `/onboarding`.
- Esto garantiza que tras la verificación de email y primer login, el usuario complete el onboarding antes de acceder al resto de la plataforma.

## Ejemplo de implementación sugerida

```jsx
useEffect(() => {
  if (
    session &&
    needsOnboarding &&
    (location.pathname === '/' || neutralRoutes.has(location.pathname))
  ) {
    navigate('/onboarding', { replace: true });
  }
}, [session, needsOnboarding, location.pathname, navigate]);
```

- Este efecto debe ir en `AppContent` junto a los otros efectos de navegación.
- Así, el usuario será llevado automáticamente al onboarding tras registrarse y verificar su email.

## Conclusión

El problema no es de registro ni de onboarding, sino de navegación tras la verificación. La solución es una redirección automática desde la home a `/onboarding` si el perfil está incompleto.
