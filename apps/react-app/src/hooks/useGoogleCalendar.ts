import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { GOOGLE_CALENDAR_CONFIG } from '../lib/googleCalendar/config';
import { startOfYear, endOfYear, format } from 'date-fns';

export interface GoogleEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  description?: string;
  location?: string;
  recurringEventId?: string;
}

export function useGoogleCalendar() {
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Carregar token salvo ao iniciar
  useEffect(() => {
    const savedToken = localStorage.getItem('google_calendar_access_token');
    if (savedToken) {
      setAccessToken(savedToken);
      fetchEvents(savedToken);
    }
  }, []);

  // Função para buscar eventos usando o token
  async function fetchEvents(token: string) {
    try {
      setIsLoading(true);
      setError(null);
      const currentYear = new Date();
      const timeMin = startOfYear(currentYear).toISOString();
      const timeMax = endOfYear(currentYear).toISOString();
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${timeMin}&` +
        `timeMax=${timeMax}&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=2500`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Falha ao buscar eventos');
      }
      const data = await response.json();
      const formattedEvents = data.items.map((event: any) => ({
        id: event.id,
        summary: event.summary,
        start: {
          dateTime: event.start.dateTime,
          date: event.start.date
        },
        end: {
          dateTime: event.end.dateTime,
          date: event.end.date
        },
        description: event.description,
        location: event.location,
        recurringEventId: event.recurringEventId
      }));
      setEvents(formattedEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar eventos');
    } finally {
      setIsLoading(false);
    }
  }

  const login = useGoogleLogin({
    scope: GOOGLE_CALENDAR_CONFIG.scopes.join(' '),
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setError(null);
        setAccessToken(tokenResponse.access_token);
        localStorage.setItem('google_calendar_access_token', tokenResponse.access_token);
        await fetchEvents(tokenResponse.access_token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar eventos');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Falha na autenticação');
    },
  });

  // Função para logout (opcional)
  function logout() {
    setAccessToken(null);
    setEvents([]);
    localStorage.removeItem('google_calendar_access_token');
  }

  return {
    events,
    isLoading,
    error,
    login,
    logout,
    accessToken,
  };
} 