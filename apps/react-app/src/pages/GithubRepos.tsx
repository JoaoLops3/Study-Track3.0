import { useState, useEffect } from 'react';
import { Github } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { GithubConnectButton } from '../components/integrations/GithubConnectButton';

interface Repo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
}

const GithubRepos = () => {
  const { settings, updateSettings } = useSettings();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        if (!settings.integrations.github) {
          setIsLoading(false);
          return;
        }

        // Obter a sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Sessão expirada. Por favor, faça login novamente.');
          return;
        }

        // Buscar o token do GitHub diretamente da sessão
        const githubToken = session.provider_token || session.user?.identities?.[0]?.identity_data?.access_token;
        console.log('Token do GitHub (session):', githubToken);
        if (!githubToken) {
          toast.error('Token do GitHub não encontrado. Por favor, reconecte sua conta.');
          return;
        }

        // Buscar os repositórios usando o token do GitHub
        const response = await fetch('https://api.github.com/user/repos', {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error('Token do GitHub expirado. Por favor, reconecte sua conta.');
            return;
          }
          throw new Error('Erro ao buscar repositórios');
        }
        
        const data = await response.json();
        setRepos(data);
      } catch (error) {
        console.error('Erro:', error);
        toast.error('Erro ao carregar repositórios');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepos();
  }, [settings.integrations.github]);

  // Efeito para garantir que settings.integrations.github seja true se o token estiver presente
  useEffect(() => {
    const checkGithubIntegration = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const githubToken = session?.provider_token || session?.user?.identities?.find(i => i.provider === 'github')?.identity_data?.access_token;
      if (githubToken && !settings.integrations.github) {
        await updateSettings({
          integrations: {
            ...settings.integrations,
            github: true
          }
        });
      }
    };
    checkGithubIntegration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Github className="w-8 h-8 text-gray-900 dark:text-white mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Meus Repositórios GitHub
          </h1>
        </div>
        <GithubConnectButton variant="primary" />
      </div>

      {!settings.integrations.github && !isLoading && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Conecte sua conta do GitHub para ver seus repositórios.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {repo.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {repo.description || 'Sem descrição'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {repo.language || 'N/A'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ⭐ {repo.stargazers_count}
                </span>
              </div>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Ver no GitHub →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GithubRepos; 