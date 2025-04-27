import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar a integração do usuário
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google_calendar')
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Integração com Google Calendar não encontrada' },
        { status: 404 }
      );
    }

    // Buscar eventos do Google Calendar
    const now = new Date();
    const timeMin = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const timeMax = new Date(now.setHours(23, 59, 59, 999)).toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&key=${process.env.GOOGLE_API_KEY}`,
      {
        headers: {
          Authorization: `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao buscar eventos do Google Calendar');
    }

    const events = await response.json();
    return NextResponse.json(events);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar eventos do calendário' },
      { status: 500 }
    );
  }
} 