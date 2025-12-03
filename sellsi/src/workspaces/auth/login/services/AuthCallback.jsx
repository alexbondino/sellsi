// 📁 domains/auth/components/AuthCallback.jsx
// Migrado de features/auth/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../services/supabase';
import { trackLoginIP } from '../../../../services/security';
import { useRole } from '../../../../infrastructure/providers';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { redirectToInitialHome } = useRole();

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

        // Manejo de OAuth/PKCE (Google, etc.)
        const hasCode = url.searchParams.get('code');
        if (hasCode) {
          console.log('🔐 Procesando OAuth/PKCE...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          );
          if (error) {
            console.error('❌ Error OAuth:', error.message);
            navigate('/?error=oauth_failed');
            return;
          }

          const user = data?.user;
          if (!user) {
            console.error('❌ No se pudo obtener usuario después de OAuth');
            navigate('/?error=oauth_user_failed');
            return;
          }

          console.log('✅ OAuth exitoso para usuario:', user.email);

          // Verificar si el perfil existe, si no, crearlo
          let { data: perfil, error: perfilError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (perfilError || !perfil) {
            console.log('📝 Creando perfil para usuario OAuth...');
            const { data: newPerfil, error: createError } = await supabase
              .from('users')
              .insert({
                user_id: user.id,
                email: user.email,
                user_nm:
                  user.user_metadata?.full_name ||
                  user.email.split('@')[0] ||
                  'Usuario',
                main_supplier: true, // Por defecto proveedor
                phone_nbr: user.user_metadata?.phone || '',
                country: user.user_metadata?.pais || 'No especificado',
                avatar_url: user.user_metadata?.avatar_url || null,
              })
              .select()
              .single();

            if (createError) {
              console.error('❌ Error creando perfil OAuth:', createError);
              // Continuar de todas formas, el perfil se puede crear después
            } else {
              perfil = newPerfil;
              console.log('✅ Perfil OAuth creado exitosamente');
            }
          } else {
            console.log('✅ Perfil OAuth ya existe');
          }

          // Guardar información en localStorage
          localStorage.setItem('user_id', user.id);

          // Tracking de IP
          try {
            const provider = user.app_metadata?.provider || 'google';
            const ipResult = await trackLoginIP(user.id, `${provider}_oauth`);
            if (ipResult.success) {
              console.log('📡 IP actualizada en login OAuth:', ipResult.ip);
            }
          } catch (ipError) {
            console.warn('⚠️ Error en tracking de IP:', ipError);
          }

          // Guardar account_type basado en main_supplier
          if (perfil?.main_supplier) {
            localStorage.setItem('account_type', 'proveedor');
          } else {
            localStorage.setItem('account_type', 'comprador');
          }

          // Redirigir usando el RoleProvider
          console.log('🔄 Redirigiendo a home...');
          setTimeout(() => {
            redirectToInitialHome();
          }, 500);
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
