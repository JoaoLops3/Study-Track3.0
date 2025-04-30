import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Obter a sessão atual
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Erro ao obter sessão:', error);
          toast.error('Erro ao processar autenticação');
          navigate('/login');
          return;
        }

        if (session?.provider_token) {
          console.log('Token do provedor recebido:', {
            token: session.provider_token.substring(0, 10) + '...',
            provider: session.provider_token.startsWith('ya29.') ? 'google' : 'outro'
          });

          // Se o token for do Google, configurar a integração com o Calendar
          if (session.provider_token.startsWith('ya29.')) {
            try {
              // Primeiro, verificar se já existe uma integração
              const { data: existingIntegration, error: fetchError } = await supabase
                .from('user_integrations')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('provider', 'google_calendar')
                .single();

              if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
              }

              const integrationData = {
                user_id: session.user.id,
                provider: 'google_calendar',
                access_token: session.provider_token,
                refresh_token: session.provider_refresh_token,
                expires_at: new Date(Date.now() + (session.expires_in || 3600) * 1000).toISOString(),
              };

              let upsertError;
              if (existingIntegration) {
                // Se existe, atualizar
                const { error } = await supabase
                  .from('user_integrations')
                  .update(integrationData)
                  .eq('user_id', session.user.id)
                  .eq('provider', 'google_calendar');
                upsertError = error;
              } else {
                // Se não existe, inserir
                const { error } = await supabase
                  .from('user_integrations')
                  .insert([integrationData]);
                upsertError = error;
              }

              if (upsertError) {
                console.error('Erro ao configurar integração com Google Calendar:', upsertError);
                toast.error('Erro ao configurar integração com Google Calendar');
              } else {
                console.log('Integração com Google Calendar configurada com sucesso');
                toast.success('Google Calendar conectado com sucesso!');
              }
            } catch (error) {
              console.error('Erro ao configurar integração com Google Calendar:', error);
              toast.error('Erro ao configurar integração com Google Calendar');
            }
          }

          // Redirecionar para a página principal
          navigate('/');
        } else {
          console.error('Nenhum token de provedor encontrado');
          toast.error('Erro na autenticação');
          navigate('/login');
        }
      } catch (error) {
        console.error('Erro ao processar callback:', error);
        toast.error('Erro ao processar autenticação');
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Processando autenticação...</h1>
        <p className="text-gray-600">Por favor, aguarde enquanto configuramos sua conta.</p>
      </div>
    </div>
  );
} 