import { supabase } from '../supabase';
import { GoogleCalendarEvent } from './types';
import { retryWithExponentialBackoff, clearCache } from './utils';
import { checkGoogleConnection } from './auth';

export async function getGoogleCalendarEvents(options: {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
} = {}): Promise<GoogleCalendarEvent[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.provider_token) {
      console.log('Token não encontrado, solicitando permissões...');
      await checkGoogleConnection();
      throw new Error('Você precisa conectar sua conta do Google para ver os eventos.');
    }

    const {
      timeMin = new Date().toISOString(),
      timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      maxResults = 100,
      singleEvents = true,
      orderBy = 'startTime'
    } = options;

    console.log('Buscando eventos com parâmetros:', {
      timeMin,
      timeMax,
      maxResults,
      singleEvents,
      orderBy
    });

    // Buscar eventos do calendário principal
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${encodeURIComponent(timeMin)}&` +
      `timeMax=${encodeURIComponent(timeMax)}&` +
      `maxResults=${maxResults}&` +
      `singleEvents=${singleEvents}&` +
      `orderBy=${orderBy}`,
      {
        headers: {
          Authorization: `Bearer ${session.provider_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao buscar eventos:', {
        status: response.status,
        error: errorData
      });

      if (response.status === 401) {
        await supabase.auth.signOut();
        await checkGoogleConnection();
        throw new Error('Sua sessão expirou. Por favor, conecte novamente sua conta do Google.');
      }

      throw new Error('Erro ao acessar seus eventos. Por favor, tente novamente.');
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.log('Nenhum evento encontrado');
      return [];
    }

    // Garantir que todos os eventos tenham timezone
    const eventsWithTimezone = data.items.map((event: any) => ({
      ...event,
      start: {
        ...event.start,
        timeZone: event.start?.timeZone || 'America/Sao_Paulo'
      },
      end: {
        ...event.end,
        timeZone: event.end?.timeZone || 'America/Sao_Paulo'
      }
    }));

    console.log('Total de eventos obtidos:', eventsWithTimezone.length);
    console.log('Eventos detalhados:', JSON.stringify(eventsWithTimezone, null, 2));
    
    return eventsWithTimezone;
  } catch (error: any) {
    console.error('Erro ao buscar eventos do Google Calendar:', error);
    throw error;
  }
}

export async function createGoogleCalendarEvent(
  event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
  }
): Promise<GoogleCalendarEvent> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.provider_token) {
      throw new Error('Token do Google não disponível');
    }

    const response = await retryWithExponentialBackoff(
      async () => {
        const response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.provider_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro ao criar evento no Google Calendar:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          
          if (response.status === 403) {
            const reason = errorData.error?.errors?.[0]?.reason;
            
            switch (reason) {
              case 'dailyLimitExceeded':
                throw new Error('Limite diário de requisições excedido. Por favor, tente novamente amanhã.');
              
              case 'userRateLimitExceeded':
              case 'rateLimitExceeded':
              case 'quotaExceeded':
                // Esses erros serão tratados pelo retryWithExponentialBackoff
                throw errorData;
              
              case 'domainPolicy':
                throw new Error('O administrador do seu domínio não permite o acesso ao Google Calendar.');
              
              case 'forbiddenForNonOrganizer':
                throw new Error('Você não tem permissão para modificar este evento.');
              
              case 'insufficientPermissions':
                throw new Error('Permissões insuficientes. Por favor, reconecte sua conta Google e conceda todas as permissões solicitadas.');
              
              default:
                throw new Error('Erro ao criar evento no Google Calendar');
            }
          }

          throw errorData;
        }

        return response;
      },
      {
        maxRetries: 3,
        initialDelay: 2000 // 2 segundos para criação de eventos
      }
    );

    const createdEvent = await response.json();
    console.log('Evento criado com sucesso:', {
      id: createdEvent.id,
      summary: createdEvent.summary
    });

    // Limpar cache de eventos após criar um novo
    clearCache();

    return createdEvent;
  } catch (error: any) {
    console.error('Erro ao criar evento no Google Calendar:', error);
    throw error;
  }
} 