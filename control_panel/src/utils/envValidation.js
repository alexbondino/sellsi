/**
 * 🔍 Validación de Variables de Entorno - Control Panel
 *
 * Este script valida que las variables de entorno estén configuradas
 * correctamente según el entorno (development, staging, production)
 */

// Variables requeridas en todos los entornos
const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_APP_ENV',
  'VITE_APP_NAME',
];

// Variables específicas por entorno
const ENV_SPECIFIC_VARS = {
  production: {
    VITE_SUPABASE_URL: 'https://pvtmkfckdaeiqrfjskrq.supabase.co',
    VITE_APP_ENV: 'production',
    VITE_ALLOW_ADMIN_CREATION_WITHOUT_AUTH: 'false',
  },
  staging: {
    VITE_SUPABASE_URL: 'https://clbngnjetipglkikondm.supabase.co',
    VITE_APP_ENV: 'staging',
    VITE_ALLOW_ADMIN_CREATION_WITHOUT_AUTH: 'true',
  },
  development: {
    VITE_SUPABASE_URL: 'https://clbngnjetipglkikondm.supabase.co',
    VITE_APP_ENV: 'development',
    VITE_ALLOW_ADMIN_CREATION_WITHOUT_AUTH: 'true',
  },
};

/**
 * Valida las variables de entorno
 */
export function validateEnvironmentVars() {
  const errors = [];
  const warnings = [];
  const info = [];

  // Detectar entorno actual
  const currentEnv = import.meta.env.VITE_APP_ENV || 'development';
  info.push(`🎯 Entorno detectado: ${currentEnv}`);

  // Validar variables requeridas
  REQUIRED_VARS.forEach(varName => {
    const value = import.meta.env[varName];
    if (!value) {
      errors.push(`❌ Variable requerida faltante: ${varName}`);
    } else {
      info.push(
        `✅ ${varName}: ${varName.includes('KEY') ? '[HIDDEN]' : value}`
      );
    }
  });

  // Validar variables específicas del entorno
  const expectedVars = ENV_SPECIFIC_VARS[currentEnv];
  if (expectedVars) {
    Object.entries(expectedVars).forEach(([varName, expectedValue]) => {
      const actualValue = import.meta.env[varName];
      if (actualValue !== expectedValue) {
        warnings.push(
          `⚠️ ${varName}: esperado '${expectedValue}', actual '${actualValue}'`
        );
      }
    });
  }

  // Validaciones de seguridad específicas
  if (currentEnv === 'production') {
    if (import.meta.env.VITE_ALLOW_ADMIN_CREATION_WITHOUT_AUTH === 'true') {
      errors.push(
        '🚨 PELIGRO: VITE_ALLOW_ADMIN_CREATION_WITHOUT_AUTH=true en producción'
      );
    }
  }

  // Mostrar resultados
  console.group('🔍 Validación de Variables de Entorno - Control Panel');

  info.forEach(msg => console.log(msg));

  if (warnings.length > 0) {
    console.group('⚠️ Advertencias:');
    warnings.forEach(msg => console.warn(msg));
    console.groupEnd();
  }

  if (errors.length > 0) {
    console.group('❌ Errores:');
    errors.forEach(msg => console.error(msg));
    console.groupEnd();
  }

  console.groupEnd();

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info,
    currentEnv,
  };
}

/**
 * Obtiene la configuración actual del entorno
 */
export function getEnvironmentConfig() {
  return {
    env: import.meta.env.VITE_APP_ENV,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    appName: import.meta.env.VITE_APP_NAME,
    allowAdminCreation:
      import.meta.env.VITE_ALLOW_ADMIN_CREATION_WITHOUT_AUTH === 'true',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  };
}

// Ejecutar validación en desarrollo
if (import.meta.env.DEV) {
  setTimeout(() => validateEnvironmentVars(), 100);
}
