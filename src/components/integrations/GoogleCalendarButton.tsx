import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function GoogleCalendarButton() {
  const { user, signInWithGoogle } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkConnection() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('google_calendar_integrations')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          throw error;
        }

        setIsConnected(!!data);
      } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        toast.error('Erro ao verificar conexão com Google Calendar');
      } finally {
        setIsLoading(false);
      }
    }

    checkConnection();
  }, [user]);

  const handleConnect = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para conectar ao Google Calendar');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Iniciando conexão com Google Calendar...');
      
      const { error } = await signInWithGoogle();
      
      if (error) {
        console.error('Erro detalhado na conexão:', error);
        throw error;
      }

      console.log('Conexão iniciada com sucesso');
      toast.success('Redirecionando para autenticação do Google...');
    } catch (error) {
      console.error('Erro ao conectar com Google Calendar:', error);
      toast.error('Erro ao conectar com Google Calendar. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('google_calendar_integrations')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setIsConnected(false);
      toast.success('Desconectado do Google Calendar com sucesso!');
    } catch (error) {
      console.error('Erro ao desconectar do Google Calendar:', error);
      toast.error('Erro ao desconectar do Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-200 text-gray-500 rounded-md cursor-not-allowed"
      >
        Carregando...
      </button>
    );
  }

  return (
    <button
      onClick={isConnected ? handleDisconnect : handleConnect}
      className={`px-4 py-2 rounded-md ${
        isConnected
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
      }`}
    >
      {isConnected ? 'Desconectar Google Calendar' : 'Conectar Google Calendar'}
    </button>
  );
} 