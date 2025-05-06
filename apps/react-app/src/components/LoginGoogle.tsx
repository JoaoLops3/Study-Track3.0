import React from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const LoginGoogle: React.FC = () => {
  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('Erro ao iniciar login com Google:', error);
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Erro no login do Google:', error);
      toast.error('Erro ao fazer login com Google');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <button
        onClick={handleGoogleLogin}
        className="flex items-center justify-center w-full max-w-[250px] px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <img
          src="https://www.google.com/favicon.ico"
          alt="Google"
          className="w-5 h-5 mr-2"
        />
        Entrar com Google
      </button>
    </div>
  );
};

export default LoginGoogle; 