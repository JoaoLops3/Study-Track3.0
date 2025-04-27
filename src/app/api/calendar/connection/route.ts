import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { accessToken, refreshToken } = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Salvar tokens no banco de dados
    const { error } = await supabase
      .from('google_calendar_integrations')
      .upsert({
        user_id: user.id,
        access_token: accessToken,
        refresh_token: refreshToken,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao conectar Google Calendar:', error);
    return NextResponse.json(
      { error: 'Erro ao conectar com o Google Calendar' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Remover integração do banco de dados
    const { error } = await supabase
      .from('google_calendar_integrations')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao desconectar Google Calendar:', error);
    return NextResponse.json(
      { error: 'Erro ao desconectar do Google Calendar' },
      { status: 500 }
    );
  }
} 