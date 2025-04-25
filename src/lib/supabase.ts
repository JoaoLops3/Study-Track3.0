import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Políticas para integrações
export const setupIntegrationPolicies = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Criar tabela de integrações se não existir
  const { error: createTableError } = await supabase.rpc('create_integrations_table');
  if (createTableError) {
    console.error('Error creating integrations table:', createTableError);
    return;
  }

  // Configurar políticas com retry
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      const { error: policyError } = await supabase.rpc('setup_integration_policies');
      if (!policyError) break;
      
      console.error(`Error setting up integration policies (attempt ${retryCount + 1}):`, policyError);
      retryCount++;
      
      if (retryCount < maxRetries) {
        // Esperar um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      retryCount++;
    }
  }
};