import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const AuthConfirmPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const confirmSession = async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error('❌ Error al obtener sesión:', sessionError);
        return;
      }

      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error('❌ Error al obtener usuario:', userError);
        return;
      }

      const user = userData.user;
      const nombre = user.user_metadata?.nombre;

      console.log('✅ Sesión confirmada para:', user.email);
      console.log('👤 Nombre recibido en metadata:', nombre);

      // 🔄 Actualiza la tabla `users` si el nombre está disponible y aún es "Pendiente"
      const { data: userRow } = await supabase
        .from('users')
        .select('user_nm')
        .eq('user_id', user.id)
        .single();

      if (userRow?.user_nm === 'Pendiente' && nombre) {
        await supabase
          .from('users')
          .update({ user_nm: nombre })
          .eq('user_id', user.id);
        console.log('✅ Nombre actualizado en tabla users');
      }

      // ✅ Redirige
      navigate('/dashboard');
    };

    confirmSession();
  }, [location.hash, navigate]);

  return <div>Verificando tu cuenta... Por favor espera.</div>;
};

export default AuthConfirmPage;
