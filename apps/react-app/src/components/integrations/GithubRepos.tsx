import { useState, useEffect } from 'react';
import { Github, Star, GitBranch, Eye } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface Repository {
  name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  html_url: string;
  language: string;
}

interface GithubReposProps {
  accessToken: string;
  onSelectRepo: (repo: any) => void;
}

const GithubRepos: React.FC<GithubReposProps> = ({ accessToken, onSelectRepo }) => {
  const { settings } = useSettings();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await fetch('https://api.github.com/user/repos', {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar repositórios');
        }

        const data = await response.json();
        setRepos(data);
      } catch (error) {
        console.error('Erro ao buscar repositórios:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (accessToken) {
      fetchRepos();
    }
  }, [accessToken]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-6 h-6 border-t-2 border-primary-600 rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando repositórios...</span>
      </div>
    );
  }

  if (!repos.length) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600 dark:text-gray-400">Nenhum repositório encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Seus Repositórios
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repos.map((repo) => (
          <a
            key={repo.name}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {repo.name}
              </h4>
              {repo.language && (
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                  {repo.language}
                </span>
              )}
            </div>
            
            {repo.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {repo.description}
              </p>
            )}

            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1" />
                <span>{repo.stargazers_count}</span>
              </div>
              <div className="flex items-center">
                <GitBranch className="w-4 h-4 mr-1" />
                <span>{repo.forks_count}</span>
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                <span>{repo.watchers_count}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default GithubRepos; 