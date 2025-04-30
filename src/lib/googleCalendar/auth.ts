import { supabase } from '../supabase';
import { GoogleConnectionStatus } from './types';
import { retryWithExponentialBackoff } from './utils';

export async function checkGoogleConnection(): Promise<GoogleConnectionStatus> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.provider_token) {
      return {
        isConnected: false,
        error: 'Usuário não está autenticado com Google'
      };
    }

    // Primeiro, buscar informações do usuário
    const userInfoResponse = await retryWithExponentialBackoff(
      async () => {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${session.provider_token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
      }
    );

    const userInfo = await userInfoResponse.json();
    console.log('Informações do usuário Google:', {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      hasPicture: !!userInfo.picture
    });

    // Depois, verificar acesso ao Calendar
    const calendarListResponse = await retryWithExponentialBackoff(
      async () => {
        const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
          headers: {
            Authorization: `Bearer ${session.provider_token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.log('Erro ao acessar Google Calendar:', {
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
                throw new Error('Limite de requisições excedido. Por favor, aguarde um momento e tente novamente.');
              
              case 'rateLimitExceeded':
                throw new Error('Limite de requisições excedido. Por favor, aguarde um momento e tente novamente.');
              
              case 'domainPolicy':
                throw new Error('O administrador do seu domínio não permite o acesso ao Google Calendar.');
              
              default:
                throw new Error('Permissões insuficientes. Por favor, reconecte sua conta Google e conceda todas as permissões solicitadas.');
            }
          }

          throw new Error('Erro ao acessar Google Calendar');
        }

        return response;
      }
    );

    const calendarList = await calendarListResponse.json();
    console.log('Lista de calendários acessada com sucesso:', {
      totalCalendars: calendarList.items?.length || 0,
      primaryCalendar: calendarList.items?.find((c: any) => c.primary)?.summary
    });

    return {
      isConnected: true,
      userInfo: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      },
      calendars: calendarList.items
    };

  } catch (error: any) {
    console.error('Erro ao verificar conexão com Google:', error);
    return {
      isConnected: false,
      error: error.message || 'Erro ao verificar conexão com Google'
    };
  }
} 