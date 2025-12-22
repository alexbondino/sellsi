// 📁 domains/auth/components/AuthCallback.jsx
// Migrado de features/auth/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../services/supabase';
import { trackLoginIP } from '../../../../services/security';
import { useRole } from '../../../../infrastructure/providers/UnifiedAuthProvider';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { redirectToInitialHome } = useRole();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const url = new URL(window.location.href);
        const searchParams = url.searchParams;
        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, '')
        );

        console.log('🔍 AuthCallback - URL completa:', window.location.href);
        console.log('🔍 Query params:', Object.fromEntries(searchParams));
        console.log('🔍 Hash params:', Object.fromEntries(hashParams));

        const error_description =
          searchParams.get('error_description') ||
          hashParams.get('error_description');

        if (error_description) {
          console.error('❌ Error de Supabase:', error_description);
          navigate('/?error=auth_failed');
          return;
        }

        // PRIORIDAD 1: Detectar recovery ANTES de que Supabase establezca sesión automática
        const type = searchParams.get('type') || hashParams.get('type');
        const access_token =
          hashParams.get('access_token') || searchParams.get('access_token');
        const refresh_token =
          hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const token_hash =
          searchParams.get('token_hash') ||
          searchParams.get('token') ||
          hashParams.get('token') ||
          hashParams.get('token_hash');

        console.log('🔍 Type detectado:', type);
        console.log('🔍 Has access_token:', !!access_token);
        console.log('🔍 Has refresh_token:', !!refresh_token);
        console.log('🔍 Has token_hash:', !!token_hash);

        // Detectar flujo de recovery: type=recovery O tiene tokens de sesión en hash
        const isRecovery =
          type === 'recovery' ||
          (access_token &&
            refresh_token &&
            type !== 'signup' &&
            type !== 'invite');

        if (isRecovery) {
          console.log('🔐 DETECTADO: Flujo de recovery password');

          // Supabase puede haber establecido la sesión automáticamente desde el hash
          // Necesitamos verificar y marcar esta sesión como "recovery" antes de redirigir
          const { data: sessionData } = await supabase.auth.getSession();

          if (sessionData?.session) {
            console.log('⚠️ Sesión de recovery ya establecida por Supabase');
            // Marcar en localStorage que esta es una sesión de recovery
            localStorage.setItem('recovery_mode', 'true');
            localStorage.setItem(
              'recovery_user_id',
              sessionData.session.user.id
            );
          }

          console.log('🚫 Redirigiendo a página de reset de contraseña...');

          // Redirigir a página de reset SIN tokens en hash (ya están en la sesión de Supabase)
          window.location.replace(
            `${window.location.origin}/auth/reset-password`
          );
          return;
        }

        // Manejo de OAuth/PKCE (Google, etc.)
        const hasCode = searchParams.get('code') || hashParams.get('code');
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

        // 🔧 Manejo de email verification/signup (NO recovery, ya se manejó arriba)
        if (token_hash && type && type !== 'recovery') {
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
