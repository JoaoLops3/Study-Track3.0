import { useState, useEffect } from 'react';
import { Github } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface Repo {
  name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
}

const GithubRepos = () => {
  const { settings } = useSettings();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        // Verificar se o usuário está conectado ao GitHub
        if (!settings.integrations.github) {
          toast.error('Você precisa conectar sua conta do GitHub primeiro');
          return;
        }

        // Obter a sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Sessão expirada. Por favor, faça login novamente.');
          return;
        }

        // Obter o token de acesso do GitHub
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Usuário não encontrado');
          return;
        }

        // Obter o token de acesso do GitHub do Supabase
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession?.provider_token) {
          toast.error('Token do GitHub não encontrado. Por favor, reconecte sua conta.');
          return;
        }

        // Buscar os repositórios usando o token do GitHub
        const response = await fetch('https://api.github.com/user/repos', {
          headers: {
            'Authorization': `Bearer ${currentSession.provider_token}`,
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

    if (settings.integrations.github) {
      fetchRepos();
    } else {
      setIsLoading(false);
    }
  }, [settings.integrations.github]);

  if (!settings.integrations.github) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Você precisa conectar sua conta do GitHub para ver seus repositórios.
          </p>
          <a
            href="/settings"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Ir para Configurações
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-8">
        <Github className="w-8 h-8 text-gray-900 dark:text-white mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Meus Repositórios GitHub
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {repos.map((repo) => (
          <a
            key={repo.name}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {repo.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {repo.description || 'Sem descrição'}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              {repo.language && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  {repo.language}
                </span>
              )}
              <span>⭐ {repo.stargazers_count}</span>
              <span>🔀 {repo.forks_count}</span>
              <span>👁️ {repo.watchers_count}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default GithubRepos; 