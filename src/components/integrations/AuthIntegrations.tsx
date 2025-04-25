import { useState } from 'react';
import { Github, Calendar, Mail, Figma, MessageSquare } from 'lucide-react';
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
    id: 'figma',
    name: 'Figma',
    icon: Figma,
    description: 'Acompanhe seus designs e protótipos',
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Integrações</h3>
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.id} className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{integration.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{integration.description}</p>
              </div>
              <button
                onClick={() => handleConnect(integration)}
                disabled={selectedIntegration?.id === integration.id}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  integration.isConnected ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    integration.isConnected ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthIntegrations; 