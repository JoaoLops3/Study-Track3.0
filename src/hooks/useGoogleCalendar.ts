import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
}

export const useGoogleCalendar = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      const { data: integration } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google_calendar')
        .single();

      setIsConnected(!!integration);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setIsConnected(false);
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado para conectar ao Google Calendar');
        return;
      }

      // Redirecionar para a página de autenticação do Google
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${redirectUrl}&response_type=code&scope=https://www.googleapis.com/auth/calendar.readonly&access_type=offline&prompt=consent`;
      
      window.location.href = authUrl;
    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast.error('Erro ao conectar ao Google Calendar');
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google_calendar');

      setIsConnected(false);
      setEvents([]);
      toast.success('Desconectado do Google Calendar com sucesso');
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast.error('Erro ao desconectar do Google Calendar');
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: integration } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google_calendar')
        .single();

      if (!integration) return;

      const response = await fetch('/api/calendar/events', {
        headers: {
          'Authorization': `Bearer ${integration.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar eventos');
      }

      const data = await response.json();
      setEvents(data.items);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast.error('Erro ao buscar eventos do calendário');
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchCalendarEvents();
    }
  }, [isConnected]);

  return {
    isConnected,
    isLoading,
    events,
    handleConnect,
    handleDisconnect,
    fetchCalendarEvents
  };
}; 