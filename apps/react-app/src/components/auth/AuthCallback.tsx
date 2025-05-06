import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          const provider = location.pathname.includes('google') ? 'Google' : 'GitHub';
          
          // Aguardar o estado ser atualizado
          if (isLoading) {
            await new Promise(resolve => {
              const checkLoading = () => {
                if (!isLoading) {
                  resolve(true);
                } else {
                  setTimeout(checkLoading, 100);
                }
              };
              checkLoading();
            });
          }
          
          navigate('/', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Erro ao processar callback:', error);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, location, isLoading]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-t-2 border-b-2 border-primary-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Processando autenticação...
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Por favor, aguarde enquanto finalizamos o processo
        </p>
      </div>
    </div>
  );
} 