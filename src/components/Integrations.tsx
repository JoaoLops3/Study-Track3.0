import { useState, useEffect } from 'react';
import { supabase, setupIntegrationPolicies } from '../lib/supabase';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import type { Database } from '../lib/database.types';

type Integration = Database['public']['Tables']['integrations']['Row'];

export function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      initializeIntegrations();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const initializeIntegrations = async () => {
    try {
      await setupIntegrationPolicies();
      await fetchIntegrations();
    } catch (error) {
      console.error('Erro ao inicializar integrações:', error);
      toast.error('Erro ao inicializar integrações');
    } finally {
      setLoading(false);
    }
  };

  const fetchIntegrations = async () => {
    try {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Erro ao buscar integrações:', error);
      toast.error('Erro ao carregar integrações');
    }
  };

  const disconnectIntegration = async (id: string) => {
    try {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Integração removida com sucesso');
      fetchIntegrations();
    } catch (error) {
      console.error('Erro ao remover integração:', error);
      toast.error('Erro ao remover integração');
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-0">
          <p>Por favor, faça login para gerenciar suas integrações.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Conteúdo do card aqui */}
      </CardContent>
    </Card>
  );
} 