import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hashProcessed, setHashProcessed] = useState(false);

  useEffect(() => {
    const handleHashChange = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) throw error;
        setHashProcessed(true);
      } catch (err) {
        console.error('Error al procesar hash:', err);
        setError('Link inválido o expirado');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleHashChange();
  }, [navigate]);

  const validatePassword = pass => {
    if (pass.length < 8)
      return 'La contraseña debe tener al menos 8 caracteres';
    if (!/[A-Z]/.test(pass)) return 'Debe incluir al menos una mayúscula';
    if (!/[a-z]/.test(pass)) return 'Debe incluir al menos una minúscula';
    if (!/[0-9]/.test(pass)) return 'Debe incluir al menos un número';
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Validaciones
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  // No mostrar el formulario hasta que se procese el hash
  if (!hashProcessed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Verificando enlace...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Restablecer contraseña
          </h2>
        </div>

        {success ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-center text-sm font-medium text-green-800">
              ¡Contraseña actualizada con éxito! Redirigiendo...
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="-space-y-px rounded-md shadow-sm">
              <div>
                <input
                  type="password"
                  required
                  className="relative block w-full rounded-t-md border px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  className="relative block w-full rounded-b-md border px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-center text-sm font-medium text-red-800">
                  {error}
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {loading ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
