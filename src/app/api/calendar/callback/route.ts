import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard?error=missing_params', request.url));
  }

  try {
    // Trocar o código por tokens
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await response.json();

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    // Salvar os tokens no banco de dados
    const { error } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: state,
        provider: 'google_calendar',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      });

    if (error) {
      throw error;
    }

    return NextResponse.redirect(new URL('/dashboard?success=connected', request.url));
  } catch (error) {
    console.error('Error in calendar callback:', error);
    return NextResponse.redirect(new URL('/dashboard?error=connection_failed', request.url));
  }
} 