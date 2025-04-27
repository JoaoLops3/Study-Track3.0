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

    // Buscar tokens do usuário
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Integração com Google Calendar não encontrada' },
        { status: 404 }
      );
    }

    // Definir data de início e fim do dia atual
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();

    // Buscar eventos do Google Calendar para o dia atual
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfDay}&timeMax=${endOfDay}&orderBy=startTime&singleEvents=true`,
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

    // Buscar tarefas do dia do banco de dados local
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('due_date', startOfDay)
      .lte('due_date', endOfDay);

    if (tasksError) {
      throw tasksError;
    }

    return NextResponse.json({
      success: true,
      events: events.items,
      tasks: tasks || []
    });
  } catch (error) {
    console.error('Erro ao buscar eventos do dia:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar eventos do dia' },
      { status: 500 }
    );
  }
} 