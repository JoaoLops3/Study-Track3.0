import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar o usuário atual
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        toast.error('Erro ao carregar dados do usuário');
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();

    // Ouvir mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    signIn: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Erro ao fazer login:', error);
        toast.error('Erro ao fazer login');
        throw error;
      }
    },
    signUp: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Erro ao criar conta:', error);
        toast.error('Erro ao criar conta');
        throw error;
      }
    },
    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        toast.success('Logout realizado com sucesso');
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        toast.error('Erro ao fazer logout');
        throw error;
      }
    },
  };
} 