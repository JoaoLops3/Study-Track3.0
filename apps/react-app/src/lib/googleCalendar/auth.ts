import { supabase } from '../supabase';
import { GoogleConnectionStatus, GoogleCalendar } from './types';
import { retryWithExponentialBackoff } from './utils';
import { GOOGLE_CALENDAR_CONFIG } from './config';

// Declaração global para o TypeScript reconhecer import.meta.env
declare global {
  interface ImportMetaEnv {
    VITE_GOOGLE_API_KEY: string;
    VITE_GOOGLE_CLIENT_ID: string;
    [key: string]: string;
  }
  interface ImportMeta {
    env: ImportMetaEnv;
  }
}

console.log('VITE_GOOGLE_API_KEY:', import.meta.env.VITE_GOOGLE_API_KEY);
console.log('VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);

// Declaração do tipo gapi para TypeScript
declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: any) => Promise<void>;
        setToken: (token: { access_token: string }) => void;
        calendar?: any;
      };
    };
  }
}

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

export async function checkGoogleConnection(): Promise<GoogleConnectionStatus> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.provider_token) {
      console.log('Iniciando fluxo de autenticação do Google...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
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
        return {
          isConnected: false,
          error: 'Erro ao iniciar autenticação com o Google'
        };
      }

      if (data?.url) {
        console.log('Redirecionando para:', data.url);
        window.location.href = data.url;
        return {
          isConnected: false,
          error: 'Redirecionando para autenticação...'
        };
      }

      return {
        isConnected: false,
        error: 'URL de redirecionamento não encontrada'
      };
    }

    // Verificar se o token ainda é válido
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
        await supabase.auth.signOut();
        return checkGoogleConnection();
      }

      const userInfo = await response.json();
      console.log('Usuário autenticado:', userInfo.email);

      // Verificar acesso ao calendário
      const calendarResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            Authorization: `Bearer ${session.provider_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!calendarResponse.ok) {
        const errorData = await calendarResponse.json();
        console.error('Erro ao acessar calendários:', errorData);
        
        if (calendarResponse.status === 401 || calendarResponse.status === 403) {
          await supabase.auth.signOut();
          return checkGoogleConnection();
        }

        return {
          isConnected: false,
          error: 'Erro ao acessar seus calendários'
        };
      }

      const calendarData = await calendarResponse.json();
      const calendars = calendarData.items.map((cal: any) => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary
      }));

      return {
        isConnected: true,
        user: userInfo,
        calendars
      };
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return {
        isConnected: false,
        error: 'Erro ao verificar token do Google'
      };
    }
  } catch (error) {
    console.error('Erro ao verificar conexão com Google:', error);
    return {
      isConnected: false,
      error: 'Erro ao verificar conexão com Google'
    };
  }
}

export async function getGoogleAccessToken(): Promise<string | null> {
  try {
    console.log('Obtendo token do Google...');
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('Nenhuma sessão encontrada');
      return null;
    }

    const token = session.provider_token;
    if (!token) {
      console.log('Token do Google não encontrado na sessão');
      return null;
    }

    // Verificar se o token ainda é válido
    console.log('Verificando validade do token...');
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.log('Token inválido, tentando renovar...');
        const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
        
        if (error || !newSession?.provider_token) {
          console.error('Erro ao renovar token:', error);
          return null;
        }

        console.log('Token renovado com sucesso');
        return newSession.provider_token;
      }

      console.log('Token válido');
      return token;
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return null;
    }
  } catch (error) {
    console.error('Erro ao obter token do Google:', error);
    return null;
  }
}

export async function initGoogleClient(): Promise<void> {
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';
  const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];

  console.log('Variáveis de ambiente no initGoogleClient:', {
    API_KEY,
    CLIENT_ID,
    DISCOVERY_DOCS,
    SCOPES
  });

  if (!CLIENT_ID || !API_KEY) {
    console.error('Variáveis de ambiente faltando:', {
      CLIENT_ID: !!CLIENT_ID,
      API_KEY: !!API_KEY
    });
    throw new Error('CLIENT_ID ou API_KEY do Google não definidos. Verifique seu arquivo .env e reinicie o servidor.');
  }

  try {
    const token = await getGoogleAccessToken();
    if (!token) {
      throw new Error('Token do Google não disponível');
    }

    // Verificar se o cliente já está inicializado
    if (window.gapi?.client?.calendar) {
      console.log('Cliente do Google já inicializado');
      return;
    }

    // Carregar a biblioteca do Google API Client
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

    // Inicializar o cliente
    await new Promise((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
          });

          // Configurar o token de acesso
          window.gapi.client.setToken({
            access_token: token
          });

          resolve(undefined);
        } catch (error) {
          reject(error);
        }
      });
    });

    console.log('Cliente do Google inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar cliente do Google:', error);
    throw error;
  }
} 