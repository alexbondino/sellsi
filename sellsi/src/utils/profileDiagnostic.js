/**
 * Script de diagnóstico para verificar el estado de las tablas de perfil
 * Ejecutar en la consola del navegador para diagnosticar problemas
 */

// Importar en el componente donde se use:
import { diagnoseTables } from '../services/profileService';

// Luego ejecutar:
const runDiagnosis = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await diagnoseTables(user.id);
  }
};

// O simplemente agregar esto temporalmente al handleUpdateProfile:
await diagnoseTables(user.id);
