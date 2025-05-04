import { useState, useEffect } from 'react';
import { LogIn, LogOut } from 'lucide-react';
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
      const { data: { session } } = await supabase.auth.getSession();
      setIsConnected(!!(settings.integrations.google && session?.provider_token));
    }
    checkGoogleToken();
  }, [settings.integrations.google]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/calendar`,
          scopes: 'https://www.googleapis.com/auth/calendar.readonly'
        }
      });
      if (error) throw error;
      if (data.url) window.location.href = data.url;
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao conectar com Google:', error);
      toast.error('Erro ao conectar com Google');
      onError?.();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsConnecting(true);
      await updateSettings({
        integrations: {
          ...settings.integrations,
          google: false
        }
      });
      // Limpar token do Google dos metadados do usuário
      const { error } = await supabase.auth.updateUser({
        data: {
          google_token: null,
          google_user: null
        }
      });
      await supabase.auth.refreshSession();
      if (error) throw error;
      toast.success('Conta do Google desconectada com sucesso');
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao desconectar Google:', error);
      toast.error('Erro ao desconectar Google');
      onError?.();
    } finally {
      setIsConnecting(false);
    }
  };

  const buttonClasses = {
    primary: 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50'
  };

  if (isConnected) {
    return (
      <button
        onClick={handleDisconnect}
        disabled={isConnecting}
        className={buttonClasses[variant]}
      >
        <LogOut className="w-5 h-5 mr-2" />
        {isConnecting ? 'Desconectando...' : 'Desconectar Google'}
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