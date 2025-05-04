import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function GoogleCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const processedRef = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      // Evitar processamento duplicado
      if (processedRef.current) return;
      processedRef.current = true;

      try {
        console.log('Processando callback do Google...');
        console.log('URL atual:', location.pathname + location.search + location.hash);

        // Extrair os parâmetros do hash da URL
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const providerToken = hashParams.get('provider_token');
        const refreshToken = hashParams.get('refresh_token');
        const expiresAt = hashParams.get('expires_at');
        const error = hashParams.get('error');

        if (error) {
          throw new Error(`Erro na autenticação do Google: ${error}`);
        }

        if (!accessToken) {
          throw new Error('Token de acesso não encontrado');
        }

        // Obter a sessão atual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError);
          throw sessionError;
        }

        if (!session?.user) {
          throw new Error('Usuário não encontrado na sessão');
        }

        // Se temos um token do provedor, salvar na tabela de integrações
        if (providerToken) {
          try {
            const { error: integrationError } = await supabase
              .from('user_integrations')
              .upsert({
                user_id: session.user.id,
                provider: 'google_calendar',
                access_token: providerToken,
                refresh_token: refreshToken,
                expires_at: expiresAt ? new Date(parseInt(expiresAt) * 1000).toISOString() : new Date(Date.now() + 3600000).toISOString()
              }, {
                onConflict: 'user_id,provider'
              });

            if (integrationError) {
              console.error('Erro ao salvar integração:', integrationError);
              throw integrationError;
            }

            console.log('Integração salva com sucesso');
          } catch (error: any) {
            // Se for erro de duplicação, ignorar pois já existe
            if (error.code === '23505') {
              console.log('Integração já existe, atualizando...');
              const { error: updateError } = await supabase
                .from('user_integrations')
                .update({
                  access_token: providerToken,
                  refresh_token: refreshToken,
                  expires_at: expiresAt ? new Date(parseInt(expiresAt) * 1000).toISOString() : new Date(Date.now() + 3600000).toISOString()
                })
                .eq('user_id', session.user.id)
                .eq('provider', 'google_calendar');

              if (updateError) {
                console.error('Erro ao atualizar integração:', updateError);
                throw updateError;
              }
              console.log('Integração atualizada com sucesso');
            } else {
              throw error;
            }
          }
        }

        toast.success('Login com Google realizado com sucesso!');
        
        // Redirecionar para a página original ou home
        const redirectPath = '/';
        console.log('Redirecionando para:', redirectPath);
        navigate(redirectPath);
      } catch (error) {
        console.error('Erro no callback do Google:', error);
        toast.error('Erro ao processar autenticação do Google');
        navigate('/login');
      }
    };

    processCallback();
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Processando autenticação...</h2>
        <p className="text-gray-600 dark:text-gray-400">Por favor, aguarde enquanto redirecionamos você.</p>
      </div>
    </div>
  );
} 