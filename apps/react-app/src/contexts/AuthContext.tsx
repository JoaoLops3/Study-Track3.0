import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  googleConnected: boolean;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null; data: any }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null; data: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null; data: any }>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  updateUserAvatar: (file: File) => Promise<{ error: Error | null }>;
  removeUserAvatar: () => Promise<{ error: Error | null }>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [hasTimeout, setHasTimeout] = useState(false);

  const checkGoogleConnectionStatus = async (session: Session | null) => {
    if (!session?.user) {
      setGoogleConnected(false);
      return;
    }

    try {
      const { isConnected } = await checkGoogleConnection();
      setGoogleConnected(isConnected);
    } catch (error) {
      console.error(
        "AuthProvider: Erro ao verificar conexão com Google:",
        error
      );
      setGoogleConnected(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    async function getSession() {
      if (!mounted) return;

      try {
        // Primeiro, tentamos obter a sessão do localStorage
        const storedSession = localStorage.getItem("supabase.auth.token");
        if (storedSession) {
          try {
            const parsedSession = JSON.parse(storedSession);
            if (parsedSession?.currentSession) {
              setSession(parsedSession.currentSession);
              setUser(parsedSession.currentSession.user);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.warn("Erro ao parsear sessão armazenada:", e);
          }
        }

        // Se não houver sessão no localStorage ou se houver erro, tentamos obter do Supabase
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn("Timeout ao carregar sessão");
            setHasTimeout(true);
            setIsLoading(false);
          }
        }, 8000);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Erro ao obter sessão:", error);
          throw error;
        }

        if (mounted) {
          clearTimeout(timeoutId);
          setSession(session);
          setUser(session?.user ?? null);

          // Removida a verificação automática do Google
          setGoogleConnected(false);
        }
      } catch (error) {
        console.error("AuthProvider: Erro ao inicializar:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setGoogleConnected(false);
        }
      } finally {
        if (mounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      }
    }

    // Tentar reconectar se houver timeout
    if (hasTimeout) {
      getSession();
      return;
    }

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setHasTimeout(false);

      // Removida a verificação automática do Google
      setGoogleConnected(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [hasTimeout]);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success("Conta criada com sucesso! Verifique seu email.");
      return { error: null, data };
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      toast.error("Erro ao criar conta");
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

      toast.success("Login realizado com sucesso!");
      return { error: null, data };
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast.error("Erro ao fazer login");
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
      toast.success("Logout realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "http://localhost:5173/reset-password",
      });

      if (error) {
        throw error;
      }

      toast.success("Email de recuperação enviado!");
      return { error: null, data: null };
    } catch (error) {
      console.error("Erro ao enviar email de recuperação:", error);
      toast.error("Erro ao enviar email de recuperação");
      return { error: error as Error, data: null };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Erro ao conectar com Google:", error);
      toast.error("Erro ao conectar com Google");
    }
  };

  const signInWithGitHub = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/github/callback`,
          scopes: "repo user read:user user:email read:org",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;

      if (data.url) {
        // Salvar o estado atual antes de redirecionar
        localStorage.setItem("github_auth_state", "pending");
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Erro ao conectar com GitHub:", error);
      toast.error("Erro ao conectar com GitHub");
      throw error;
    }
  };

  const updateUserAvatar = async (file: File) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");

      console.log("Iniciando atualização do avatar...");

      // Se o usuário já tiver um avatar personalizado, remova-o primeiro
      if (user.user_metadata?.custom_avatar_url) {
        console.log("Removendo avatar personalizado anterior...");
        const oldFilePath = user.user_metadata.custom_avatar_url
          .split("/")
          .pop();
        if (oldFilePath) {
          await supabase.storage
            .from("avatars")
            .remove([`${user.id}/${oldFilePath}`]);
        }
      }

      // Gera um nome único para o arquivo
      const fileName = `${Date.now()}-${file.name.replace(
        /[^a-zA-Z0-9.]/g,
        ""
      )}`;
      const filePath = `${user.id}/${fileName}`;

      console.log("Fazendo upload do novo avatar:", filePath);

      // Upload do novo avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "0",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obtém a URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      console.log("URL pública do avatar:", publicUrl);

      // Atualiza os metadados do usuário
      const { data: userData, error: updateError } =
        await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            custom_avatar_url: publicUrl,
            updated_at: new Date().toISOString(),
          },
        });

      if (updateError) throw updateError;

      console.log("Metadados atualizados:", userData);

      // Atualiza o estado local
      if (userData.user) {
        setUser(userData.user);
      }

      toast.success("Avatar atualizado com sucesso!");
      return { error: null };
    } catch (error) {
      console.error("Erro ao atualizar avatar:", error);
      toast.error("Erro ao atualizar avatar");
      return { error: error as Error };
    }
  };

  const removeUserAvatar = async () => {
    try {
      if (!user) throw new Error("Usuário não autenticado");

      console.log("Iniciando remoção do avatar...");

      // Remove o arquivo do storage se existir
      if (user.user_metadata?.custom_avatar_url) {
        const filePath = user.user_metadata.custom_avatar_url.split("/").pop();
        if (filePath) {
          console.log("Removendo arquivo do storage:", filePath);
          await supabase.storage
            .from("avatars")
            .remove([`${user.id}/${filePath}`]);
        }
      }

      // Atualiza os metadados do usuário
      const { data: userData, error: updateError } =
        await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            custom_avatar_url: null,
            updated_at: new Date().toISOString(),
          },
        });

      if (updateError) throw updateError;

      console.log("Metadados atualizados após remoção:", userData);

      // Atualiza o estado local
      if (userData.user) {
        setUser(userData.user);
      }

      toast.success("Avatar removido com sucesso!");
      return { error: null };
    } catch (error) {
      console.error("Erro ao remover avatar:", error);
      toast.error("Erro ao remover avatar");
      return { error: error as Error };
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
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
