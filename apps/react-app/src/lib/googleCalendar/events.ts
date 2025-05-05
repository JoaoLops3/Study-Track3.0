import { supabase } from '../supabase';
import { GoogleCalendarEvent } from './types';
import { retryWithExponentialBackoff, clearCache } from './utils';
import { checkGoogleConnection, getGoogleAccessToken } from './auth';

export async function getGoogleCalendarEvents(
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> {
  try {
    console.log('Iniciando busca de eventos do Google Calendar...');
    
    // Verificar sessão e token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('Nenhuma sessão encontrada');
      throw new Error('Sessão não encontrada');
    }

    const token = await getGoogleAccessToken();
    if (!token) {
      console.error('Token do Google não disponível');
      throw new Error('Token do Google não disponível');
    }

    // Parâmetros fixos
    const baseParams = {
      timeMin,
      timeMax,
      maxResults: '2500',
      singleEvents: 'true',
      orderBy: 'startTime',
      timeZone: 'America/Sao_Paulo',
      showDeleted: 'false',
      showHiddenInvitations: 'false'
    };
    let allEvents: any[] = [];
    let nextPageToken: string | undefined = undefined;
    do {
      const params = new URLSearchParams({ ...baseParams, ...(nextPageToken ? { pageToken: nextPageToken } : {}) });
      console.log('Buscando eventos com parâmetros:', { ...baseParams, nextPageToken });
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (!response.ok) {
        const error = await response.json();
        console.error('Erro na resposta da API:', error);
        if (response.status === 401) {
          throw new Error('Sessão expirada. Por favor, reconecte sua conta Google.');
        }
        throw new Error(`Erro ao buscar eventos: ${error.error?.message || 'Erro desconhecido'}`);
      }
      const data = await response.json();
      console.log('Resposta da API:', {
        totalItems: data.items?.length,
        nextPageToken: data.nextPageToken,
        timeZone: data.timeZone
      });
      if (Array.isArray(data.items)) {
        allEvents = allEvents.concat(data.items);
      }
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    // Processar e validar eventos
    const validEvents = allEvents
      .map((event: any) => {
        try {
          // Validar datas
          if (!event.start || (!event.start.dateTime && !event.start.date)) {
            console.warn('Evento ignorado: datas inválidas', event);
            return null;
          }

          // Processar datas
          let startDate: Date;
          let endDate: Date;
          let allDay = false;

          if (event.start.dateTime) {
            // Para eventos com horário específico
            startDate = new Date(event.start.dateTime);
            endDate = new Date(event.end.dateTime);
            allDay = false;
          } else {
            // Para eventos de dia inteiro
            const startStr = event.start.date;
            const endStr = event.end.date;
            
            // Criar datas no timezone local
            startDate = new Date(startStr + 'T00:00:00-03:00');
            endDate = new Date(endStr + 'T00:00:00-03:00');
            
            // Se a data de fim for igual à data de início + 1 dia, é um evento de um dia
            const isOneDayEvent = endDate.getTime() - startDate.getTime() === 24 * 60 * 60 * 1000;
            
            if (isOneDayEvent) {
              // Para eventos de um dia, usar a mesma data para início e fim
              startDate = new Date(startStr + 'T00:00:00-03:00');
              endDate = new Date(startStr + 'T23:59:59-03:00');
            } else {
              // Para eventos de múltiplos dias, usar o dia anterior como fim
              startDate = new Date(startStr + 'T00:00:00-03:00');
              endDate = new Date(endStr + 'T00:00:00-03:00');
              endDate.setDate(endDate.getDate() - 1);
              endDate.setHours(23, 59, 59, 999);
            }
            allDay = true;
          }

          // Validar datas
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn('Evento ignorado: datas inválidas após conversão', event);
            return null;
          }

          console.log('Evento processado:', {
            id: event.id,
            summary: event.summary,
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            allDay,
            originalStart: event.start,
            originalEnd: event.end,
            recurringEventId: event.recurringEventId
          });

          return {
            id: event.id,
            summary: event.summary || 'Sem título',
            description: event.description || '',
            start: {
              dateTime: startDate.toISOString(),
              timeZone: 'America/Sao_Paulo'
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: 'America/Sao_Paulo'
            },
            allDay
          };
        } catch (error) {
          console.error('Erro ao processar evento:', error);
          return null;
        }
      })
      .filter((event): event is GoogleCalendarEvent => event !== null);

    console.log('Total de eventos válidos:', validEvents.length);
    return validEvents;
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    throw error;
  }
}

function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
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
    const token = await getGoogleAccessToken();
    if (!token) {
      throw new Error('Token do Google não disponível');
    }

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao criar evento');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    throw error;
  }
} 