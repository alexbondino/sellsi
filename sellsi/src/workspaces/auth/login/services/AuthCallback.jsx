// 📁 domains/auth/components/AuthCallback.jsx
// Migrado de features/auth/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../services/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const url = new URL(window.location.href);
        const token_hash =
          url.searchParams.get('token_hash') || url.searchParams.get('token');
        const type = url.searchParams.get('type');
        const error_description = url.searchParams.get('error_description');

        // Manejar errores de Supabase
        if (error_description) {
          console.error('❌ Error de Supabase:', error_description);
          navigate('/?error=auth_failed');
          return;
        }

        // Manejo de OAuth/PKCE
        const hasCode = url.searchParams.get('code');
        if (hasCode) {
          console.log('🔐 Procesando OAuth/PKCE...');
          const { error } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          );
          if (error) {
            console.error('❌ Error OAuth:', error.message);
            navigate('/?error=oauth_failed');
            return;
          }
          console.log('✅ OAuth exitoso');
          navigate('/', { replace: true });
          return;
        }

        // 🔧 NUEVO: Manejo de email verification/signup/recovery
        if (token_hash && type) {
          console.log(`🔐 Verificando token de tipo: ${type}...`);

          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type,
          });

          if (error) {
            console.error('❌ Error verificando token:', error.message);
            navigate('/?error=verification_failed');
            return;
          }

          console.log('✅ Token verificado exitosamente');

          // Manejar recuperación de contraseña - redirigir al formulario de reset
          if (type === 'recovery') {
            console.log(
              '🔐 Token de recuperación verificado, redirigiendo a reset password...'
            );
            navigate('/auth/reset-password', { replace: true });
            return;
          }

          // Crear perfil temporal si no existe (para signup/invite)
          if (data?.user && (type === 'signup' || type === 'invite')) {
            console.log('📝 Verificando perfil de usuario...');

            const { data: existingProfile } = await supabase
              .from('users')
              .select('user_id, user_nm')
              .eq('user_id', data.user.id)
              .single();

            // Solo crear si no existe o si está en estado pendiente
            if (
              !existingProfile ||
              existingProfile.user_nm?.toLowerCase() === 'pendiente'
            ) {
              const { error: profileError } = await supabase
                .from('users')
                .upsert(
                  {
                    user_id: data.user.id,
                    email: data.user.email,
                    user_nm: 'pendiente', // Marca para onboarding
                    main_supplier: true,
                    country: 'No especificado',
                  },
                  {
                    onConflict: 'user_id',
                    ignoreDuplicates: false,
                  }
                );

              if (profileError && profileError.code !== '23505') {
                console.warn(
                  '⚠️ Error al crear/actualizar perfil:',
                  profileError.message
                );
              } else {
                console.log('✅ Perfil temporal creado/actualizado');
              }
            } else {
              console.log('✅ Perfil ya existe');
            }
          }

          navigate('/', { replace: true });
          return;
        }

        // Sin parámetros reconocidos, redirigir a home
        console.warn('⚠️ AuthCallback sin parámetros reconocidos');
        navigate('/', { replace: true });
      } catch (err) {
        console.error('❌ Error inesperado en AuthCallback:', err);
        navigate('/?error=unexpected');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#333',
      }}
    >
      <div style={{ fontSize: '3rem' }}>🔐</div>
      <p style={{ fontSize: '1.2rem', fontWeight: 500 }}>
        Verificando tu cuenta...
      </p>
      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Por favor espera un momento
      </p>
    </div>
  );
}
