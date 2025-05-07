import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";

const TeamInvite = () => {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);

  useEffect(() => {
    if (!inviteId) {
      setError("Convite inválido");
      setLoading(false);
      return;
    }

    fetchInvite();
  }, [inviteId]);

  const fetchInvite = async () => {
    try {
      // Buscar detalhes do convite
      const { data: inviteData, error: inviteError } = await supabase
        .from("team_invites")
        .select(
          `
          *,
          teams (
            name,
            description
          )
        `
        )
        .eq("id", inviteId)
        .single();

      if (inviteError) throw inviteError;

      if (!inviteData) {
        setError("Convite não encontrado");
        setLoading(false);
        return;
      }

      if (inviteData.status !== "pending") {
        setError("Este convite já foi usado ou expirou");
        setLoading(false);
        return;
      }

      if (new Date(inviteData.expires_at) < new Date()) {
        setError("Este convite expirou");
        setLoading(false);
        return;
      }

      setInvite(inviteData);
      setTeam(inviteData.teams);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching invite:", error);
      setError("Erro ao carregar convite");
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!user) {
      // Redirecionar para login se não estiver autenticado
      navigate("/login", { state: { returnTo: `/team/invite/${inviteId}` } });
      return;
    }

    try {
      setLoading(true);

      // Verificar se o email do usuário corresponde ao convite
      if (user.email !== invite.email) {
        setError("Este convite foi enviado para outro email");
        setLoading(false);
        return;
      }

      // Atualizar status do convite
      const { error: updateError } = await supabase
        .from("team_invites")
        .update({ status: "accepted" })
        .eq("id", inviteId);

      if (updateError) throw updateError;

      // Adicionar usuário como membro da equipe
      const { error: memberError } = await supabase
        .from("team_members")
        .insert([
          {
            team_id: invite.team_id,
            user_id: user.id,
            role: invite.role,
          },
        ]);

      if (memberError) throw memberError;

      // Redirecionar para a página da equipe
      navigate("/team");
    } catch (error) {
      console.error("Error accepting invite:", error);
      setError("Erro ao aceitar convite");
      setLoading(false);
    }
  };

  const handleRejectInvite = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("team_invites")
        .update({ status: "rejected" })
        .eq("id", inviteId);

      if (error) throw error;

      navigate("/team");
    } catch (error) {
      console.error("Error rejecting invite:", error);
      setError("Erro ao rejeitar convite");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Erro
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <button
          onClick={() => navigate("/team")}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Voltar para Equipes
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-screen p-4"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Convite para Equipe
        </h1>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {team.name}
            </h2>
            {team.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {team.description}
              </p>
            )}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-gray-600 dark:text-gray-400">
              Você foi convidado para participar desta equipe como{" "}
              <span className="font-medium">
                {invite.role === "admin" ? "Administrador" : "Membro"}
              </span>
            </p>
          </div>
          <div className="flex space-x-4 pt-4">
            <button
              onClick={handleRejectInvite}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Recusar
            </button>
            <button
              onClick={handleAcceptInvite}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Aceitar
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TeamInvite;
