import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

export default function GitHubCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleGitHubCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || 'Erro na autenticação do GitHub');
        }

        if (!code) {
          throw new Error('Código de autenticação não encontrado');
        }

        if (!state) {
          throw new Error('Estado de segurança não encontrado');
        }

        const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);

        if (authError) {
          throw authError;
        }

        if (!data?.session) {
          throw new Error('Sessão não criada corretamente');
        }

        toast.success('Login com GitHub realizado com sucesso!');
        navigate('/');
      } catch (error) {
        console.error('Erro ao processar callback do GitHub:', error);
        setError(error instanceof Error ? error.message : 'Erro ao processar autenticação do GitHub');
        toast.error('Erro ao processar autenticação do GitHub');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleGitHubCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Erro na autenticação
          </h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-gray-500 mt-2">
            Redirecionando para a página de login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <h1 className="text-2xl font-bold text-gray-900 mt-4">
          Processando autenticação...
        </h1>
        <p className="text-gray-600 mt-2">
          Por favor, aguarde enquanto processamos seu login com o GitHub.
        </p>
      </div>
    </div>
  );
} 