import { supabase } from '../supabase';
import { GoogleConnectionStatus, GoogleCalendar } from './types';
import { retryWithExponentialBackoff } from './utils';
import { GOOGLE_CALENDAR_CONFIG } from './config';

export async function checkCalendarPermissions(calendarId: string, token: string): Promise<boolean> {
  try {
    console.log('Verificando permissões do calendário:', calendarId);
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Erro ao verificar permissões do calendário:', {
        status: response.status,
        error: errorData
      });

      if (response.status === 404) {
        console.log('Calendário não encontrado, tentando lista de calendários...');
        // Se o calendário específico não for encontrado, verificar a lista de calendários
        const listResponse = await fetch(
          'https://www.googleapis.com/calendar/v3/users/me/calendarList',
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!listResponse.ok) {
          throw new Error('Erro ao acessar lista de calendários');
        }

        const calendars = await listResponse.json();
        return calendars.items.some((cal: any) => cal.id === calendarId);
      }

      throw new Error('Erro ao verificar permissões do calendário');
    }

    return true;
  } catch (error) {
    console.error('Erro ao verificar permissões do calendário:', error);
    return false;
  }
}

async function requestCalendarPermissions(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.provider_token) {
      console.log('Iniciando fluxo de autenticação do Google...');
      
      // Iniciar o fluxo de autenticação do Google
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: GOOGLE_CALENDAR_CONFIG.redirectUri,
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
        console.error('Erro ao iniciar autenticação:', error);
        throw error;
      }

      if (data?.url) {
        console.log('Redirecionando para:', data.url);
        
        // Salvar o estado atual antes do redirecionamento
        sessionStorage.setItem('google_auth_state', window.location.pathname);
        sessionStorage.setItem('google_auth_timestamp', Date.now().toString());
        
        window.location.href = data.url;
      } else {
        throw new Error('URL de redirecionamento não encontrada');
      }
    } else {
      console.log('Token existente encontrado, verificando validade...');
      
      // Se já temos um token, verificar se ele ainda é válido
      try {
        const response = await fetch(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: {
              Authorization: `Bearer ${session.provider_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          console.log('Token inválido, solicitando novo...');
          // Token inválido, solicitar novo
          await supabase.auth.signOut();
          await requestCalendarPermissions();
        } else {
          console.log('Token válido, continuando...');
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error);
        await supabase.auth.signOut();
        await requestCalendarPermissions();
      }
    }
  } catch (error) {
    console.error('Erro ao solicitar permissões do Google Calendar:', error);
    throw error;
  }
}

export async function checkGoogleConnection(): Promise<GoogleConnectionStatus> {
  try {
    // Verificar se estamos retornando de um redirecionamento
    const savedState = sessionStorage.getItem('google_auth_state');
    const savedTimestamp = sessionStorage.getItem('google_auth_timestamp');
    
    if (savedState && savedTimestamp) {
      const timestamp = parseInt(savedTimestamp);
      const now = Date.now();
      
      // Se passou mais de 5 minutos, limpar o estado
      if (now - timestamp > 5 * 60 * 1000) {
        sessionStorage.removeItem('google_auth_state');
        sessionStorage.removeItem('google_auth_timestamp');
      }
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.provider_token) {
      // Tentar renovar o token
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !newSession?.provider_token) {
        console.log('Sessão não encontrada, solicitando autenticação...');
        await requestCalendarPermissions();
        return {
          isConnected: false,
          error: 'Usuário não está autenticado com Google'
        };
      }
    }

    const token = session?.provider_token || (await supabase.auth.getSession()).data.session?.provider_token;

    if (!token) {
      console.log('Token não encontrado, solicitando autenticação...');
      await requestCalendarPermissions();
      return {
        isConnected: false,
        error: 'Token do Google não disponível'
      };
    }

    // Verificar informações do usuário
    const userInfoResponse = await retryWithExponentialBackoff(
      async () => {
        const response = await fetch(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.log('Token inválido ou sem permissões, solicitando novo...');
            await supabase.auth.signOut();
            await requestCalendarPermissions();
            throw new Error('Token inválido ou sem permissões. Redirecionando para autenticação...');
          }
          throw new Error('Erro ao buscar informações do usuário');
        }

        return response;
      }
    );

    const userInfo = await userInfoResponse.json();
    console.log('Informações do usuário obtidas com sucesso:', {
      email: userInfo.email,
      name: userInfo.name
    });

    // Verificar acesso ao calendário
    const calendarResponse = await retryWithExponentialBackoff(
      async () => {
        const response = await fetch(
          'https://www.googleapis.com/calendar/v3/users/me/calendarList',
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.log('Erro ao acessar lista de calendários:', {
            status: response.status,
            error: errorData
          });

          if (response.status === 401 || response.status === 403) {
            const reason = errorData.error?.errors?.[0]?.reason;
            
            if (reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT' || reason === 'insufficientPermissions') {
              console.log('Escopos insuficientes, solicitando novas permissões...');
              await supabase.auth.signOut();
              await requestCalendarPermissions();
              throw new Error('Permissões insuficientes. Redirecionando para solicitar permissões...');
            }
            
            switch (reason) {
              case 'dailyLimitExceeded':
                throw new Error('Limite diário de requisições excedido. Por favor, tente novamente amanhã.');
              
              case 'userRateLimitExceeded':
                // Aguardar 1 minuto antes de tentar novamente
                await new Promise(resolve => setTimeout(resolve, 60000));
                return checkGoogleConnection(); // Tentar novamente após o delay
              
              case 'rateLimitExceeded':
                // Aguardar 10 segundos antes de tentar novamente
                await new Promise(resolve => setTimeout(resolve, 10000));
                return checkGoogleConnection(); // Tentar novamente após o delay
              
              case 'domainPolicy':
                throw new Error('O administrador do seu domínio não permite o acesso ao Google Calendar.');
              
              default:
                throw new Error('Permissões insuficientes. Por favor, reconecte sua conta Google e conceda todas as permissões solicitadas.');
            }
          }

          throw new Error('Erro ao acessar lista de calendários');
        }

        return response;
      }
    );

    const calendarData = await calendarResponse.json();
    const calendars = calendarData.items as GoogleCalendar[];

    // Verificar permissões de cada calendário
    const calendarsWithPermissions = await Promise.all(
      calendars.map(async (calendar) => {
        const hasPermission = await checkCalendarPermissions(calendar.id, token);
        return {
          ...calendar,
          hasPermission
        };
      })
    );

    // Filtrar calendários sem permissão
    const accessibleCalendars = calendarsWithPermissions.filter(cal => cal.hasPermission);

    if (accessibleCalendars.length === 0) {
      // Se não houver calendários acessíveis, solicitar permissões novamente
      await requestCalendarPermissions();
      return {
        isConnected: true,
        userInfo: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        },
        calendarError: 'Nenhum calendário acessível encontrado. Redirecionando para solicitar permissões...'
      };
    }

    return {
      isConnected: true,
      userInfo: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      },
      calendars: accessibleCalendars
    };

  } catch (error: any) {
    console.error('Erro ao verificar conexão com Google:', error);
    
    // Se o erro for relacionado a permissões, tentar solicitar novamente
    if (error.message?.includes('Permissões insuficientes') || 
        error.message?.includes('Token inválido') ||
        error.message?.includes('sem permissões')) {
      await requestCalendarPermissions();
    }
    
    return {
      isConnected: false,
      error: error.message || 'Erro ao verificar conexão com Google'
    };
  }
} 