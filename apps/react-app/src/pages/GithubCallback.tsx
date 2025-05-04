import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const GithubCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/github');
      } else {
        navigate('/login');
      }
    };
    checkSession();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Conectando com GitHub...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Por favor, aguarde enquanto processamos sua autenticação.
        </p>
      </div>
    </div>
  );
};

export default GithubCallback; 