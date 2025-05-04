import { createClient } from '@supabase/supabase-js';
import { config } from '../config/test';
import { Database } from './database.types';

const isTest = process.env.NODE_ENV === 'test';

const supabaseUrl = isTest
  ? 'https://mock-supabase-url.com'
  : import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = isTest
  ? 'mock-anon-key'
  : import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação mais detalhada das variáveis de ambiente
if (!isTest) {
  if (!supabaseUrl) {
    console.error('VITE_SUPABASE_URL não está definida no arquivo .env');
    throw new Error('VITE_SUPABASE_URL não está definida. Verifique o arquivo .env');
  }

  if (!supabaseAnonKey) {
    console.error('VITE_SUPABASE_ANON_KEY não está definida no arquivo .env');
    throw new Error('VITE_SUPABASE_ANON_KEY não está definida. Verifique o arquivo .env');
  }

  // Validação básica do formato da URL
  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.error('VITE_SUPABASE_URL não é uma URL válida:', supabaseUrl);
    throw new Error('VITE_SUPABASE_URL não é uma URL válida');
  }

  // Validação básica da chave anônima
  if (supabaseAnonKey.length < 10) {
    console.error('VITE_SUPABASE_ANON_KEY parece estar em formato inválido');
    throw new Error('VITE_SUPABASE_ANON_KEY parece estar em formato inválido');
  }
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Presente' : 'Ausente');

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export async function setupIntegrationPolicies() {
  console.log('Iniciando setupIntegrationPolicies');
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Erro ao buscar sessão:', sessionError);
      throw sessionError;
    }
    
    if (!session?.user) {
      console.log('Usuário não autenticado');
      throw new Error('Usuário não autenticado');
    }

    console.log('Verificando integrações existentes para usuário:', session.user.id);
    
    // Verificar se já existem registros para o usuário
    const { data: existingIntegrations, error: fetchError } = await supabase
      .from('user_integrations')
      .select('id')
      .eq('user_id', session.user.id)
      .limit(1);

    if (fetchError) {
      console.error('Erro ao buscar integrações existentes:', fetchError);
      throw fetchError;
    }

    // Se não houver registros, criar os registros iniciais
    if (!existingIntegrations || existingIntegrations.length === 0) {
      console.log('Criando registros iniciais de integração');
      const { error: insertError } = await supabase
        .from('user_integrations')
        .insert([
          {
            user_id: session.user.id,
            provider: 'google',
            access_token: '', // Token vazio inicial
            refresh_token: null, // Token de atualização nulo inicial
            expires_at: null, // Data de expiração nula inicial
            scope: null // Escopo nulo inicial
          },
          {
            user_id: session.user.id,
            provider: 'github',
            access_token: '', // Token vazio inicial
            refresh_token: null, // Token de atualização nulo inicial
            expires_at: null, // Data de expiração nula inicial
            scope: null // Escopo nulo inicial
          }
        ]);

      if (insertError) {
        console.error('Erro ao criar registros iniciais:', insertError);
        throw insertError;
      }
      
      console.log('Registros iniciais criados com sucesso');
    } else {
      console.log('Integrações já existem para o usuário');
    }
  } catch (error) {
    console.error('Erro ao configurar políticas de integração:', error);
    throw error;
  }
} 