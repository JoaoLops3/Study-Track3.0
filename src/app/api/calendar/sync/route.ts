import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar tokens do usuário
    const { data: integration, error: integrationError } = await supabase
      .from('google_calendar_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Integração com Google Calendar não encontrada' },
        { status: 404 }
      );
    }

    // Buscar eventos do Google Calendar
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        headers: {
          Authorization: `Bearer ${integration.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao buscar eventos do Google Calendar');
    }

    const events = await response.json();

    // Salvar eventos no banco de dados
    const { error: syncError } = await supabase
      .from('calendar_events')
      .upsert(
        events.items.map((event: any) => ({
          user_id: user.id,
          google_event_id: event.id,
          title: event.summary,
          description: event.description,
          start_time: event.start.dateTime || event.start.date,
          end_time: event.end.dateTime || event.end.date,
          location: event.location,
          status: event.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      );

    if (syncError) {
      throw syncError;
    }

    return NextResponse.json({ success: true, events: events.items });
  } catch (error) {
    console.error('Erro ao sincronizar eventos:', error);
    return NextResponse.json(
      { error: 'Erro ao sincronizar eventos do Google Calendar' },
      { status: 500 }
    );
  }
} 