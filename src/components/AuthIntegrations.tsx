import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function AuthIntegrations() {
  const { user } = useAuth();

  const handleGoogleCalendarConnect = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'https://www.googleapis.com/auth/calendar',
        },
      });

      if (error) throw error;
      
      // Armazenar o token de acesso quando retornar do callback
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.provider_token) {
        // Salvar o token no banco de dados
        const { error: dbError } = await supabase
          .from('integrations')
          .upsert({
            user_id: user?.id,
            provider: 'google_calendar',
            access_token: session.provider_token,
            refresh_token: session.provider_refresh_token,
          });

        if (dbError) throw dbError;
        toast.success('Google Calendar conectado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao conectar Google Calendar:', error);
      toast.error('Erro ao conectar Google Calendar');
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleGoogleCalendarConnect}
        className="btn-primary"
      >
        Conectar Google Calendar
      </button>
    </div>
  );
} 