import { useState, useEffect } from 'react';
import { LogIn, LogOut, Check } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface GoogleConnectButtonProps {
  variant?: 'primary' | 'secondary';
  onSuccess?: () => void;
  onError?: () => void;
}

export const GoogleConnectButton = ({
  variant = 'primary',
  onSuccess,
  onError
}: GoogleConnectButtonProps) => {
  const { settings, updateSettings } = useSettings();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    async function checkGoogleToken() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const hasToken = !!(settings.integrations.google && session?.provider_token);
        setIsConnected(hasToken);
        
        if (hasToken) {
          console.log('Token do Google presente');
        } else {
          console.log('Token do Google não encontrado');
        }
      } catch (error) {
        console.error('Erro ao verificar token do Google:', error);
        setIsConnected(false);
      }
    }
    checkGoogleToken();
  }, [settings.integrations.google]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      console.log('Iniciando conexão com Google...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/calendar`,
          scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/calendar.events.readonly',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
          ].join(' '),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true'
          }
        }
      });

      if (error) {
        console.error('Erro na autenticação do Google:', error);
        throw error;
      }

      if (data.url) {
        // Atualizar integração Google para true antes de redirecionar
        await updateSettings({
          integrations: {
            ...settings.integrations,
            google: true
          }
        });
        console.log('Redirecionando para autenticação do Google...');
        window.location.href = data.url;
      } else {
        console.error('URL de redirecionamento não encontrada');
        throw new Error('URL de redirecionamento não encontrada');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Erro ao conectar com Google:', error);
      toast.error('Erro ao conectar com Google. Por favor, tente novamente.');
      onError?.();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsConnecting(true);
      console.log('Iniciando desconexão do Google...');

      // Primeiro, atualizar as configurações
      await updateSettings({
        integrations: {
          ...settings.integrations,
          google: false
        }
      });

      // Limpar token do Google dos metadados do usuário
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          google_token: null,
          google_user: null
        }
      });

      if (updateError) {
        console.error('Erro ao atualizar usuário:', updateError);
        throw updateError;
      }

      // Atualizar a sessão
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Erro ao atualizar sessão:', refreshError);
        throw refreshError;
      }

      console.log('Desconexão do Google concluída com sucesso');
      toast.success('Conta do Google desconectada com sucesso');
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao desconectar Google:', error);
      toast.error('Erro ao desconectar Google. Por favor, tente novamente.');
      onError?.();
    } finally {
      setIsConnecting(false);
    }
  };

  const buttonClasses = {
    primary: 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50',
    success: 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed'
  };

  if (isConnected) {
    return (
      <button
        onClick={handleDisconnect}
        disabled={isConnecting}
        className={buttonClasses.success}
      >
        <Check className="w-5 h-5 mr-2" />
        {isConnecting ? 'Desconectando...' : 'Google Conectado'}
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className={buttonClasses[variant]}
    >
      <LogIn className="w-5 h-5 mr-2" />
      {isConnecting ? 'Conectando...' : 'Conectar Google'}
    </button>
  );
}; 