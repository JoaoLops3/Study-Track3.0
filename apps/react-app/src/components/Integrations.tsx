import { useState, useEffect } from "react";
import { supabase, setupIntegrationPolicies } from "../lib/supabase";
import { Card, CardContent } from "./ui/card";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import type { Database } from "../lib/database.types";
import { useSettings } from "../contexts/SettingsContext";

type Integration = Database["public"]["Tables"]["integrations"]["Row"];

export function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    console.log("Integrations: useEffect triggered", { authLoading, user });
    if (!authLoading) {
      if (user) {
        console.log(
          "Integrations: Iniciando integrações para usuário:",
          user.id
        );
        initializeIntegrations();
      } else {
        console.log(
          "Integrations: Usuário não autenticado, finalizando carregamento"
        );
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const initializeIntegrations = async () => {
    console.log("Integrations: Iniciando initializeIntegrations");
    try {
      console.log("Integrations: Chamando setupIntegrationPolicies");
      await setupIntegrationPolicies();
      console.log("Integrations: setupIntegrationPolicies concluído");
      await fetchIntegrations();
      console.log("Integrations: fetchIntegrations concluído");
    } catch (error) {
      console.error("Integrations: Erro ao inicializar integrações:", error);
      toast.error("Erro ao inicializar integrações");
    } finally {
      console.log("Integrations: Finalizando initializeIntegrations");
      setLoading(false);
    }
  };

  const fetchIntegrations = async () => {
    console.log("Integrations: Iniciando fetchIntegrations");
    try {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      console.log("Integrations: Buscando integrações para usuário:", user.id);
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Integrations: Erro ao buscar integrações:", error);
        throw error;
      }

      console.log("Integrations: Integrações encontradas:", data);
      setIntegrations(data || []);
    } catch (error) {
      console.error("Integrations: Erro ao buscar integrações:", error);
      toast.error("Erro ao carregar integrações");
      setLoading(false);
    }
  };

  const disconnectIntegration = async (id: string) => {
    try {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { error } = await supabase
        .from("integrations")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Integração removida com sucesso");
      await fetchIntegrations();
    } catch (error) {
      console.error("Erro ao remover integração:", error);
      toast.error("Erro ao remover integração");
    }
  };

  console.log("Integrations: Renderizando componente:", {
    loading,
    authLoading,
    user,
    integrations,
  });

  if (loading || authLoading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-0">
          <p>Por favor, faça login para gerenciar suas integrações.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {integrations.length > 0 && (
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 border-b"
              >
                <div>
                  <h3 className="font-medium">{integration.provider}</h3>
                  <p className="text-sm text-gray-500">
                    {integration.enabled ? "Ativado" : "Desativado"}
                  </p>
                </div>
                <button
                  onClick={() => disconnectIntegration(integration.id)}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  Desconectar
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
