import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const LoginGoogle: React.FC = () => {
  useEffect(() => {
    const initializeGoogleAuth = async () => {
      try {
        // Remover script anterior se existir
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existingScript) {
          existingScript.remove();
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
          const currentOrigin = window.location.origin;
          console.log('Inicializando Google Auth com origem:', currentOrigin);

          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            context: 'signin',
            ux_mode: 'popup',
            prompt_parent_id: 'google-login-button',
            origin: currentOrigin
          });

          const buttonElement = document.getElementById('google-login-button');
          if (buttonElement) {
            window.google.accounts.id.renderButton(
              buttonElement,
              {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: 250,
                locale: 'pt-BR'
              }
            );
          } else {
            console.error('Elemento google-login-button não encontrado');
          }
        };

        script.onerror = (error) => {
          console.error('Erro ao carregar script do Google:', error);
          toast.error('Erro ao carregar autenticação do Google');
        };
      } catch (error) {
        console.error('Erro ao inicializar autenticação do Google:', error);
        toast.error('Erro ao inicializar autenticação do Google');
      }
    };

    initializeGoogleAuth();

    // Cleanup function
    return () => {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) {
        script.remove();
      }
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      console.log('Login Google OK:', response);
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        toast.success('Login realizado com sucesso!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Erro no login do Google:', error);
      toast.error('Erro ao fazer login com Google');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div id="google-login-button" className="w-full max-w-[250px]" />
    </div>
  );
};

export default LoginGoogle; 