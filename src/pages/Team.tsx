import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Mail, X, UserPlus, UserMinus, Shield, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

type Team = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  updated_at: string;
  user_profiles?: {
    email: string;
  };
};

type TeamInvite = {
  id: string;
  team_id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected';
  invited_by: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
};

const Team = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Record<string, TeamMember[]>>({});
  const [invites, setInvites] = useState<Record<string, TeamInvite[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');

  useEffect(() => {
    if (user) {
      fetchTeams();
    }
  }, [user]);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      
      // Buscar equipes
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .or(`owner_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // Buscar membros para cada equipe
      const membersData: Record<string, TeamMember[]> = {};
      const invitesData: Record<string, TeamInvite[]> = {};

      for (const team of teamsData || []) {
        // Buscar membros
        const { data: teamMembers, error: membersError } = await supabase
          .from('team_members')
          .select(`
            *,
            user_profiles (
              email
            )
          `)
          .eq('team_id', team.id);

        if (membersError) throw membersError;
        membersData[team.id] = teamMembers || [];

        // Buscar convites
        const { data: teamInvites, error: invitesError } = await supabase
          .from('team_invites')
          .select('*')
          .eq('team_id', team.id)
          .eq('status', 'pending');

        if (invitesError) throw invitesError;
        invitesData[team.id] = teamInvites || [];
      }

      setMembers(membersData);
      setInvites(invitesData);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Erro ao carregar equipes');
    } finally {
      setIsLoading(false);
    }
  };

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert([
          {
            name: newTeamName,
            description: newTeamDescription,
            owner_id: user.id,
          },
        ])
        .select()
        .single();

      if (teamError) throw teamError;

      // Adicionar o criador como membro com role 'owner'
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([
          {
            team_id: team.id,
            user_id: user.id,
            role: 'owner',
          },
        ]);

      if (memberError) throw memberError;

      setTeams((prev) => [team, ...prev]);
      setNewTeamName('');
      setNewTeamDescription('');
      setIsCreatingTeam(false);
      toast.success('Equipe criada com sucesso!');
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Erro ao criar equipe');
    }
  };

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    try {
      const { error } = await supabase
        .from('team_invites')
        .insert([
          {
            team_id: selectedTeam,
            email: inviteEmail,
            role: inviteRole,
            invited_by: user?.id,
          },
        ]);

      if (error) throw error;

      setInvites((prev) => ({
        ...prev,
        [selectedTeam]: [
          ...(prev[selectedTeam] || []),
          {
            id: '',
            team_id: selectedTeam,
            email: inviteEmail,
            role: inviteRole,
            status: 'pending',
            invited_by: user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      }));

      setInviteEmail('');
      setInviteRole('member');
      setIsInvitingMember(false);
      toast.success('Convite enviado com sucesso!');
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('Erro ao enviar convite');
    }
  };

  const removeMember = async (teamId: string, memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers((prev) => ({
        ...prev,
        [teamId]: prev[teamId].filter((member) => member.id !== memberId),
      }));

      toast.success('Membro removido com sucesso!');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Erro ao remover membro');
    }
  };

  const cancelInvite = async (teamId: string, inviteId: string) => {
    try {
      const { error } = await supabase
        .from('team_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      setInvites((prev) => ({
        ...prev,
        [teamId]: prev[teamId].filter((invite) => invite.id !== inviteId),
      }));

      toast.success('Convite cancelado com sucesso!');
    } catch (error) {
      console.error('Error canceling invite:', error);
      toast.error('Erro ao cancelar convite');
    }
  };

  const updateMemberRole = async (teamId: string, memberId: string, newRole: 'admin' | 'member') => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      setMembers((prev) => ({
        ...prev,
        [teamId]: prev[teamId].map((member) =>
          member.id === memberId ? { ...member, role: newRole } : member
        ),
      }));

      toast.success('Função atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Erro ao atualizar função');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equipes</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreatingTeam(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Equipe
        </motion.button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-32"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {teams.map((team) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {team.name}
                  </h2>
                  {team.description && (
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      {team.description}
                    </p>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedTeam(team.id);
                    setIsInvitingMember(true);
                  }}
                  className="flex items-center px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Convidar
                </motion.button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Membros
                  </h3>
                  <div className="space-y-2">
                    {members[team.id]?.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                      >
                        <div className="flex items-center">
                          {getRoleIcon(member.role)}
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {member.user_profiles?.email}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {member.role !== 'owner' && (
                            <>
                              <select
                                value={member.role}
                                onChange={(e) =>
                                  updateMemberRole(
                                    team.id,
                                    member.id,
                                    e.target.value as 'admin' | 'member'
                                  )
                                }
                                className="text-sm border-gray-300 dark:border-gray-600 rounded-md"
                                disabled={member.user_id === user?.id}
                              >
                                <option value="member">Membro</option>
                                <option value="admin">Admin</option>
                              </select>
                              <button
                                onClick={() => removeMember(team.id, member.id)}
                                className="text-red-500 hover:text-red-700"
                                disabled={member.user_id === user?.id}
                              >
                                <UserMinus className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {invites[team.id]?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Convites Pendentes
                    </h3>
                    <div className="space-y-2">
                      {invites[team.id].map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                        >
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {invite.email}
                            </span>
                          </div>
                          <button
                            onClick={() => cancelInvite(team.id, invite.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de Nova Equipe */}
      {isCreatingTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Criar Nova Equipe</h2>
            <form onSubmit={createTeam}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Digite o nome da equipe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descrição
                  </label>
                  <textarea
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Digite a descrição da equipe"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingTeam(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Convidar Membro */}
      {isInvitingMember && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Convidar Membro</h2>
            <form onSubmit={inviteMember}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Digite o email do membro"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Função
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="member">Membro</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsInvitingMember(false);
                    setSelectedTeam(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
                >
                  Enviar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Team; 