import { useState } from "react";
import { Github } from "lucide-react";
import { useSettings } from "../../contexts/SettingsContext";
import { supabase } from "../../lib/supabase";

interface GithubIntegrationProps {
  onConnect: () => void;
  onDisconnect: () => void;
}

const GithubIntegration = ({
  onConnect,
  onDisconnect,
}: GithubIntegrationProps) => {
  const { settings } = useSettings();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setIsLoading(true);

      const scopes = [
        "repo",
        "user",
        "read:user",
        "user:email",
        "read:org",
      ].join(" ");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/github/callback`,
          scopes,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao conectar com GitHub:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);

      // Remover token do GitHub das configurações
      // TODO: Implemente saveSettings no SettingsContext se necessário.

      onDisconnect();
    } catch (error) {
      console.error("Erro ao desconectar GitHub:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Github className="w-6 h-6 text-gray-900 dark:text-white" />
          <span className="ml-2 font-medium text-gray-900 dark:text-white">
            GitHub
          </span>
        </div>

        {settings.integrations.github ? (
          <button
            onClick={handleDisconnect}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            {isLoading ? "Desconectando..." : "Desconectar"}
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
          >
            {isLoading ? "Conectando..." : "Conectar"}
          </button>
        )}
      </div>
    </div>
  );
};

export default GithubIntegration;
