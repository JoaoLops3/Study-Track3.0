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

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Presente' : 'Ausente');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam variáveis de ambiente do Supabase. Verifique o arquivo .env');
}

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
      .from('integrations')
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
        .from('integrations')
        .insert([
          {
            user_id: session.user.id,
            provider: 'google',
            enabled: false,
            settings: {}
          },
          {
            user_id: session.user.id,
            provider: 'github',
            enabled: false,
            settings: {}
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