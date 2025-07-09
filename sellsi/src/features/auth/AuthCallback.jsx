// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    const hasCode = url.searchParams.get('code');
    const hasVerifier = url.searchParams.get('code_verifier');

    const handleAuth = async () => {
      if (hasCode && hasVerifier) {
        // Solo para OAuth/PKCE
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );
        if (error) {
          console.error('Error autenticando:', error.message);
        }
      }
      // Para verificación de email, simplemente redirige
      navigate('/');
    };
    handleAuth();
  }, [navigate]);

  return <p>Autenticando...</p>;
}
