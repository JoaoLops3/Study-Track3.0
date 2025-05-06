import { redirect } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (code) {
    // Processar o código de autenticação aqui
    return redirect('/dashboard');
  }
  
  return redirect('/login');
} 