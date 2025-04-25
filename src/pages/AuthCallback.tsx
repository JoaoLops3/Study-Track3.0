import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // O Supabase já lida com o callback automaticamente
        // Aqui só precisamos verificar se houve algum erro
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (session) {
          toast.success('Autenticação realizada com sucesso!');
          // Redireciona para o dashboard após o login
          navigate('/dashboard');
        } else {
          throw new Error('Sessão não encontrada');
        }
      } catch (error) {
        console.error('Erro ao processar autenticação:', error);
        toast.error('Erro ao processar autenticação');
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