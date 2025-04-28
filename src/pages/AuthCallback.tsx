import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      let retries = 0;
      let session = null;
      let error = null;

      while (retries < 5 && !session) {
        const result = await supabase.auth.getSession();
        session = result.data.session;
        error = result.error;
        if (session) break;
        await new Promise(res => setTimeout(res, 500)); // espera 0.5s
        retries++;
      }

      if (error) {
        console.error('Erro ao processar autenticação:', error);
        toast.error('Erro ao processar autenticação');
        navigate('/login?error=auth-failed');
        return;
      }

      if (session) {
        toast.success('Autenticação realizada com sucesso!');
        navigate('/dashboard');
      } else {
        toast.error('Sessão não encontrada');
        navigate('/login?error=auth-failed');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Processando autenticação...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Por favor, aguarde enquanto processamos sua autenticação.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback; 