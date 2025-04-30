import { supabase } from '../supabase';
import { GoogleCalendarEvent } from './types';
import { retryWithExponentialBackoff } from './utils';

export async function getGoogleCalendarEvents(): Promise<GoogleCalendarEvent[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.provider_token) {
      throw new Error('Usuário não está autenticado com Google');
    }

    const response = await retryWithExponentialBackoff(
      async () => {
        const now = new Date();
        const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
          `timeMin=${now.toISOString()}&` +
          `timeMax=${oneMonthFromNow.toISOString()}&` +
          `singleEvents=true&` +
          `orderBy=startTime`,
          {
            headers: {
              Authorization: `Bearer ${session.provider_token}`
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          
          if (response.status === 403) {
            const reason = errorData.error?.errors?.[0]?.reason;
            
            switch (reason) {
              case 'dailyLimitExceeded':
                throw new Error('Limite diário de requisições excedido. Por favor, tente novamente amanhã.');
              
              case 'userRateLimitExceeded':
                // Aguardar 1 minuto antes de tentar novamente
                await new Promise(resolve => setTimeout(resolve, 60000));
                return getGoogleCalendarEvents(); // Tentar novamente após o delay
              
              case 'rateLimitExceeded':
                // Aguardar 10 segundos antes de tentar novamente
                await new Promise(resolve => setTimeout(resolve, 10000));
                return getGoogleCalendarEvents(); // Tentar novamente após o delay
              
              case 'domainPolicy':
                throw new Error('O administrador do seu domínio não permite o acesso ao Google Calendar.');
              
              default:
                throw new Error('Permissões insuficientes. Por favor, reconecte sua conta Google e conceda todas as permissões solicitadas.');
            }
          }

          throw new Error('Erro ao buscar eventos do Google Calendar');
        }

        return response;
      }
    );

    const data = await response.json();
    
    return data.items.map((event: GoogleCalendarEvent) => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start,
      end: event.end,
      status: event.status,
      htmlLink: event.htmlLink
    }));

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
      throw new Error('Usuário não está autenticado com Google');
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
          
          if (response.status === 403) {
            const reason = errorData.error?.errors?.[0]?.reason;
            
            switch (reason) {
              case 'dailyLimitExceeded':
                throw new Error('Limite diário de requisições excedido. Por favor, tente novamente amanhã.');
              
              case 'userRateLimitExceeded':
                // Aguardar 1 minuto antes de tentar novamente
                await new Promise(resolve => setTimeout(resolve, 60000));
                return createGoogleCalendarEvent(event); // Tentar novamente após o delay
              
              case 'rateLimitExceeded':
                // Aguardar 10 segundos antes de tentar novamente
                await new Promise(resolve => setTimeout(resolve, 10000));
                return createGoogleCalendarEvent(event); // Tentar novamente após o delay
              
              case 'domainPolicy':
                throw new Error('O administrador do seu domínio não permite o acesso ao Google Calendar.');
              
              default:
                throw new Error('Permissões insuficientes. Por favor, reconecte sua conta Google e conceda todas as permissões solicitadas.');
            }
          }

          throw new Error('Erro ao criar evento no Google Calendar');
        }

        return response;
      }
    );

    return response.json();

  } catch (error: any) {
    console.error('Erro ao criar evento no Google Calendar:', error);
    throw error;
  }
} 