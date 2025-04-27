import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      throw new Error('Código de autorização não encontrado');
    }

    // Trocar o código por tokens
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: 'http://localhost:5173/auth/google/callback',
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao obter tokens do Google');
    }

    const tokens = await response.json();

    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Salvar os tokens no banco de dados
    await supabase
      .from('user_integrations')
      .upsert({
        user_id: user.id,
        provider: 'google_calendar',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      });

    // Redirecionar de volta para o dashboard
    return NextResponse.redirect('http://localhost:5173/dashboard');
  } catch (error) {
    console.error('Erro no callback do Google:', error);
    return NextResponse.redirect('http://localhost:5173/dashboard?error=auth_failed');
  }
} 