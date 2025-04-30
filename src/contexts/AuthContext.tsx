import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { checkGoogleConnection } from '../lib/googleCalendar';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  googleConnected: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; data: any }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; data: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null; data: any }>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  updateUserAvatar: (file: File) => Promise<void>;
  removeUserAvatar: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    let mounted = true;
    console.log('AuthProvider: Iniciando verificação de sessão');

    async function getSession() {
      if (!mounted) {
        console.log('AuthProvider: Componente desmontado, abortando');
        return;
      }
      
      try {
        console.log('AuthProvider: Buscando sessão do Supabase');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Erro ao buscar sessão:', error);
          throw error;
        }
        
        console.log('AuthProvider: Sessão encontrada:', {
          hasSession: !!session,
          provider: session?.provider_token ? 'Presente' : 'Ausente',
          userId: session?.user?.id || 'Nenhum'
        });

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            try {
              const { isConnected } = await checkGoogleConnection();
              if (mounted) {
                setGoogleConnected(isConnected);
              }
            } catch (error) {
              console.error('AuthProvider: Erro ao verificar conexão com Google:', error);
            }
          }
        }
      } catch (error) {
        console.error('AuthProvider: Erro ao inicializar:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setGoogleConnected(false);
        }
      } finally {
        if (mounted) {
          console.log('AuthProvider: Finalizando carregamento');
          setIsLoading(false);
        }
      }
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Mudança no estado de autenticação:', {
          event,
          hasSession: !!session,
          provider: session?.provider_token ? 'Presente' : 'Ausente',
          userId: session?.user?.id || 'Nenhum'
        });
        
        if (!mounted) {
          console.log('AuthProvider: Componente desmontado, ignorando mudança de estado');
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            const { isConnected } = await checkGoogleConnection();
            if (mounted) {
              setGoogleConnected(isConnected);
            }
          } catch (error) {
            console.error('AuthProvider: Erro ao verificar conexão com Google:', error);
            if (mounted) {
              setGoogleConnected(false);
            }
          }
        } else {
          setGoogleConnected(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success('Conta criada com sucesso! Verifique seu email.');
      return { error: null, data };
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast.error('Erro ao criar conta');
      return { error: error as Error, data: null };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success('Login realizado com sucesso!');
      return { error: null, data };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast.error('Erro ao fazer login');
      return { error: error as Error, data: null };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      setUser(null);
      setSession(null);
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:5173/reset-password',
      });

      if (error) {
        throw error;
      }

      toast.success('Email de recuperação enviado!');
      return { error: null, data: null };
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      toast.error('Erro ao enviar email de recuperação');
      return { error: error as Error, data: null };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Primeiro, fazer logout para limpar qualquer estado anterior
      await supabase.auth.signOut();

      const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly'
      ].join(' ');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/google/callback`,
          scopes,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true'
          }
        }
      });

      if (error) {
        throw error;
      }

      toast.success('Login com Google iniciado!');
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      toast.error('Erro ao fazer login com Google');
    }
  };

  const signInWithGitHub = async () => {
    try {
      const scopes = [
        'repo',
        'user',
        'read:user',
        'user:email',
        'read:org'
      ].join(' ');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/github/callback`,
          scopes,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao fazer login com GitHub:', error);
      toast.error('Erro ao fazer login com GitHub');
    }
  };

  const updateUserAvatar = async (file: File) => {
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .upload(`${user?.id}/${file.name}`, file);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${user?.id}/${file.name}`);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) {
        throw updateError;
      }

      toast.success('Avatar atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar avatar:', error);
      toast.error('Erro ao atualizar avatar');
    }
  };

  const removeUserAvatar = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: null }
      });

      if (error) {
        throw error;
      }

      toast.success('Avatar removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover avatar:', error);
      toast.error('Erro ao remover avatar');
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    googleConnected,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithGoogle,
    signInWithGitHub,
    updateUserAvatar,
    removeUserAvatar,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}