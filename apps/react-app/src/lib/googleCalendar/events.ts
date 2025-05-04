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

    // Primeiro, buscar a lista de calendários
    const calendarListResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${session.provider_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!calendarListResponse.ok) {
      const errorData = await calendarListResponse.json();
      console.error('Erro ao buscar lista de calendários:', {
        status: calendarListResponse.status,
        error: errorData
      });

      if (calendarListResponse.status === 401) {
        await supabase.auth.signOut();
        await checkGoogleConnection();
        throw new Error('Sua sessão expirou. Por favor, conecte novamente sua conta do Google.');
      }

      throw new Error('Erro ao acessar seus calendários. Por favor, tente novamente.');
    }

    const calendarList = await calendarListResponse.json();
    
    if (!calendarList.items || calendarList.items.length === 0) {
      throw new Error('Nenhum calendário encontrado. Verifique se você tem calendários no Google Calendar.');
    }

    // Buscar eventos de cada calendário
    const allEvents: GoogleCalendarEvent[] = [];
    
    for (const calendar of calendarList.items) {
      const params = new URLSearchParams({
        timeMin,
        timeMax,
        maxResults: maxResults.toString(),
        singleEvents: singleEvents.toString(),
        orderBy
      });

      const cacheKey = `events_${calendar.id}_${params.toString()}`;

      try {
        const response = await retryWithExponentialBackoff(
          async () => {
            console.log('Fazendo requisição para o calendário:', calendar.id);
            console.log('Parâmetros da requisição:', {
              timeMin,
              timeMax,
              maxResults,
              singleEvents,
              orderBy
            });
            
            const response = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?${params}`,
              {
                headers: {
                  Authorization: `Bearer ${session.provider_token}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              console.error('Erro ao acessar eventos do calendário:', {
                calendarId: calendar.id,
                status: response.status,
                statusText: response.statusText,
                error: errorData
              });

              if (response.status === 401) {
                console.log('Token expirado, solicitando novo...');
                await supabase.auth.signOut();
                await checkGoogleConnection();
                throw new Error('Token expirado. Redirecionando para autenticação...');
              }

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
                  
                  case 'insufficientPermissions':
                    console.log('Permissões insuficientes, solicitando novas permissões...');
                    await checkGoogleConnection();
                    throw new Error('Permissões insuficientes. Redirecionando para solicitar permissões...');
                  
                  default:
                    throw new Error('Erro ao acessar eventos do Google Calendar');
                }
              }

              throw errorData;
            }

            return response;
          },
          {
            cacheKey,
            cacheDuration: 5 * 60 * 1000 // 5 minutos
          }
        );

        const data = await response.json();
        console.log('Eventos obtidos do calendário:', {
          calendarId: calendar.id,
          total: data.items?.length || 0,
          items: data.items?.map((item: any) => ({
            id: item.id,
            summary: item.summary,
            start: item.start,
            end: item.end,
            description: item.description,
            timeZone: item.start?.timeZone || 'America/Sao_Paulo'
          }))
        });

        if (data.items) {
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
          allEvents.push(...eventsWithTimezone);
        }
      } catch (error) {
        console.error(`Erro ao buscar eventos do calendário ${calendar.id}:`, error);
        // Continuar com o próximo calendário mesmo se houver erro
        continue;
      }
    }

    console.log('Total de eventos obtidos de todos os calendários:', allEvents.length);
    console.log('Eventos detalhados:', JSON.stringify(allEvents, null, 2));
    return allEvents;
  } catch (error: any) {
    console.error('Erro ao buscar eventos do Google Calendar:', error);
    
    // Limpar cache em caso de erro
    clearCache();
    
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