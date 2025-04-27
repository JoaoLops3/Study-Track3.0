import { supabase } from '../lib/supabase';

export async function getGoogleCalendarEvents(userId: string) {
  // Buscar o access_token salvo no banco
  const { data, error } = await supabase
    .from('google_calendar_integrations')
    .select('access_token')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Não foi possível obter o token do Google Calendar');
  }

  const accessToken = data.access_token;

  // Buscar eventos do Google Calendar
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=20&orderBy=startTime&singleEvents=true&timeMin=' + new Date().toISOString(),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Erro ao buscar eventos do Google Calendar');
  }

  const events = await response.json();
  return events.items;
} 