import { useState } from 'react';
import { Github, Calendar, Mail, Trello, Slack, Figma, FileText, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Integration {
  id: string;
  name: string;
  icon: any;
  description: string;
  isConnected: boolean;
}

const integrations: Integration[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    description: 'Conecte seus repositórios e acompanhe suas contribuições',
    isConnected: false
  },
  {
    id: 'google',
    name: 'Google',
    icon: Mail,
    description: 'Acesse seu Gmail, Google Drive e outros serviços Google',
    isConnected: false
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    icon: Calendar,
    description: 'Sincronize seus eventos e compromissos',
    isConnected: false
  },
  {
    id: 'trello',
    name: 'Trello',
    icon: Trello,
    description: 'Integre seus quadros e cards do Trello',
    isConnected: false
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: Slack,
    description: 'Receba notificações e integre com seus canais',
    isConnected: false
  },
  {
    id: 'figma',
    name: 'Figma',
    icon: Figma,
    description: 'Acompanhe seus designs e protótipos',
    isConnected: false
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: FileText,
    description: 'Sincronize suas notas e documentos',
    isConnected: false
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: MessageSquare,
    description: 'Integre com seus servidores e canais',
    isConnected: false
  }
];

const AuthIntegrations = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const handleConnect = async (integration: Integration) => {
    try {
      setSelectedIntegration(integration);
      
      switch (integration.id) {
        case 'github':
          const { data: githubData, error: githubError } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`
            }
          });
          if (githubError) throw githubError;
          break;

        case 'google':
        case 'google-calendar':
          const { data: googleData, error: googleError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
              scopes: integration.id === 'google-calendar' ? 'https://www.googleapis.com/auth/calendar' : ''
            }
          });
          if (googleError) throw googleError;
          break;

        case 'figma':
          const { data: figmaData, error: figmaError } = await supabase.auth.signInWithOAuth({
            provider: 'figma',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
              scopes: 'files:read'
            }
          });
          if (figmaError) throw figmaError;
          break;

        case 'discord':
          const { data: discordData, error: discordError } = await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
              scopes: 'identify email guilds'
            }
          });
          if (discordError) throw discordError;
          break;

        default:
          toast.error('Integração ainda não implementada');
          return;
      }

      toast.success(`Conectado com sucesso ao ${integration.name}!`);
    } catch (error) {
      console.error('Error connecting to integration:', error);
      toast.error(`Erro ao conectar com ${integration.name}`);
    } finally {
      setSelectedIntegration(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
      >
        <span>Integrações</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Conectar Contas</h3>
            <div className="space-y-4">
              {integrations.map((integration) => (
                <button
                  key={integration.id}
                  onClick={() => handleConnect(integration)}
                  disabled={selectedIntegration?.id === integration.id}
                  className="flex items-center w-full p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <integration.icon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {integration.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {integration.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthIntegrations; 