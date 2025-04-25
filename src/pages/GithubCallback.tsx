import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const GithubCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { saveSettings } = useSettings();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        
        if (!code) {
          throw new Error('Código de autorização não encontrado');
        }

        // Trocar o código por um token de acesso
        const response = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
            client_secret: import.meta.env.VITE_GITHUB_CLIENT_SECRET,
            code,
          }),
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error_description || 'Erro ao obter token de acesso');
        }

        // Obter informações do usuário do GitHub
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `token ${data.access_token}`,
          },
        });

        const userData = await userResponse.json();

        // Salvar as informações de integração
        await saveSettings({
          integrations: {
            github: true
          }
        });

        // Redirecionar de volta para a página de configurações
        toast.success('GitHub conectado com sucesso!');
        navigate('/settings');
      } catch (error) {
        console.error('Erro ao processar callback do GitHub:', error);
        toast.error('Erro ao conectar com GitHub');
        navigate('/settings?error=github-auth-failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate, saveSettings]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Conectando com GitHub...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Por favor, aguarde enquanto processamos sua autenticação.
        </p>
      </div>
    </div>
  );
};

export default GithubCallback; 