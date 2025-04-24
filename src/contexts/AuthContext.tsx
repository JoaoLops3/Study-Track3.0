import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: any;
  }>;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: any;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    error: Error | null;
    data: any;
  }>;
  signInWithGoogle: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getSession() {
      setIsLoading(true);
      
      try {
        console.log('Buscando sessão...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao buscar sessão:', error);
          throw error;
        }
        
        if (session) {
          console.log('Sessão encontrada:', {
            user: session.user.email,
            id: session.user.id,
            expires_at: session.expires_at
          });
          setSession(session);
          setUser(session.user);
        } else {
          console.log('Nenhuma sessão encontrada');
        }
      } catch (error) {
        console.error('Error getting session:', error);
        toast.error('Erro ao verificar autenticação');
      } finally {
        setIsLoading(false);
      }
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', {
          event,
          user: session?.user?.email,
          id: session?.user?.id,
          expires_at: session?.expires_at
        });
        
        if (event === 'SIGNED_IN') {
          console.log('Usuário autenticado:', {
            email: session?.user?.email,
            id: session?.user?.id
          });
          toast.success('Bem-vindo!');
        } else if (event === 'SIGNED_OUT') {
          console.log('Usuário deslogado');
          toast.success('Até logo!');
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Tentando criar conta...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('Erro ao criar conta:', error);
        throw error;
      }
      
      console.log('Conta criada com sucesso:', {
        email: data.user?.email,
        id: data.user?.id
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Tentando fazer login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Erro ao fazer login:', error);
        throw error;
      }
      
      console.log('Login realizado com sucesso:', {
        email: data.user?.email,
        id: data.user?.id
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Tentando fazer logout...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout:', error);
        throw error;
      }
      
      console.log('Logout realizado com sucesso');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('Tentando resetar senha...');
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        console.error('Erro ao resetar senha:', error);
        throw error;
      }
      
      console.log('Email de reset enviado com sucesso');
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { error };
  };

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}