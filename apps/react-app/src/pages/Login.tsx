import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../hooks/useNavigation';
import { motion } from 'framer-motion';
import { LogIn, Mail, UserPlus, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import LoginGoogle from '../components/LoginGoogle';
import { useNavigate } from 'react-router-dom';
import { GOOGLE_CALENDAR_CONFIG } from '../lib/googleCalendar/config';

const Login = () => {
  const { signIn } = useAuth();
  const { goToDashboard } = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      goToDashboard();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Conta criada com sucesso! Verifique seu email para confirmar o cadastro.');
      setIsRegistering(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: GOOGLE_CALENDAR_CONFIG.redirectUri,
          queryParams: {
            scope: GOOGLE_CALENDAR_CONFIG.scopes.join(' '),
            access_type: 'offline',
            prompt: 'consent'
          }
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo-Study-Track.png" 
              alt="Study Track Logo" 
              className="h-24 w-24"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-20">
            Study Track
          </h1>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {isRegistering ? 'Criar uma conta' : 'Bem-vindo de volta'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isRegistering ? 'Preencha seus dados para começar' : 'Entre para continuar sua jornada'}
          </p>
        </div>

        <form onSubmit={isRegistering ? handleRegister : handleEmailLogin} className="mt-8 space-y-6">
          {!isRegistering && (
            <>
              <LoginGoogle />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    Ou continue com email
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                placeholder="E-mail"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white ${!isRegistering ? 'rounded-b-md' : ''} focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-800 pr-10`}
                placeholder="Senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                )}
              </button>
            </div>
            {isRegistering && (
              <div className="relative">
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirmar Senha
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-800 pr-10"
                  placeholder="Confirmar Senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isRegistering ? (
                  <UserPlus className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
                ) : (
                  <Mail className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
                )}
              </span>
              {isRegistering ? 'Criar conta' : 'Entrar com email'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
          >
            {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Crie aqui'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login; 