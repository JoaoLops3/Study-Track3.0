'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('Iniciando callback...');
      const session = await supabase.auth.getSession();
      console.log('Session:', session);
      
      if (session.data.session?.provider_token) {
        try {
          console.log('Salvando tokens...');
          const { error } = await supabase
            .from('user_integrations')
            .upsert({
              user_id: session.data.session.user.id,
              provider: 'google_calendar',
              access_token: session.data.session.provider_token,
              refresh_token: session.data.session.provider_refresh_token,
              expires_at: new Date(Date.now() + (session.data.session.expires_in || 3600) * 1000).toISOString(),
            });

          if (error) {
            console.error('Erro ao salvar tokens:', error);
            throw error;
          }
          
          console.log('Tokens salvos com sucesso');
        } catch (error) {
          console.error('Erro ao salvar tokens:', error);
        }
      } else {
        console.log('Nenhum token encontrado na sessão');
      }
    };

    if (searchParams.has('code')) {
      console.log('Código de autorização encontrado');
      handleAuthCallback();
    }
  }, [searchParams]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Conteúdo do dashboard */}
      </div>
    </div>
  );
} 