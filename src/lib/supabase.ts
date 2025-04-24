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
  if (createTableError) console.error('Error creating integrations table:', createTableError);

  // Adicionar políticas para integrações
  const { error: policyError } = await supabase.rpc('setup_integration_policies', {
    user_id: user.id
  });
  if (policyError) console.error('Error setting up integration policies:', policyError);
};