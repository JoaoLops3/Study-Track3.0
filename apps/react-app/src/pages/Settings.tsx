import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  User,
  Mail,
  Lock,
  Bell,
  Eye,
  Globe,
  Shield,
  Clock,
  Keyboard,
  Users,
  Sun,
  Moon,
  Monitor,
  Github,
  Calendar,
  Figma,
  MessageSquare,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import heic2any from "heic2any";
import Integrations from "../components/Integrations";
import { useFontSize } from "../hooks/useFontSize";
import { useSettings } from "../contexts/SettingsContext";
import GithubIntegration from "../components/integrations/GithubIntegration";
import GithubRepos from "../components/integrations/GithubRepos";
import { GithubConnectButton } from "../components/integrations/GithubConnectButton";

type Settings = {
  profile: {
    name: string;
    email: string;
    photoUrl?: string;
  };
  appearance: {
    theme: "light" | "dark" | "system";
    fontSize: "small" | "medium" | "large";
  };
  notifications: {
    email: boolean;
    push: boolean;
  };
  privacy: {
    profileVisibility: "public" | "private";
    dataSharing: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    loginAlerts: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
  };
  integrations: {
    github: boolean;
    google: boolean;
    figma: boolean;
    discord: boolean;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
  };
  team: {
    members: string[];
    roles: Record<string, string>;
  };
};

const defaultSettings: Settings = {
  profile: {
    name: "",
    email: "",
  },
  appearance: {
    theme: "system",
    fontSize: "medium",
  },
  notifications: {
    email: true,
    push: true,
  },
  privacy: {
    profileVisibility: "private",
    dataSharing: false,
  },
  security: {
    twoFactorAuth: false,
    loginAlerts: true,
  },
  preferences: {
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
  },
  integrations: {
    github: false,
    google: false,
    figma: false,
    discord: false,
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
  },
  team: {
    members: [],
    roles: {},
  },
};

const Settings = () => {
  const { user, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setFontSize } = useFontSize();
  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { settings: globalSettings } = useSettings();
  const [editedName, setEditedName] = useState("");
  const [editedPhotoUrl, setEditedPhotoUrl] = useState<string | undefined>(
    undefined
  );
  const [editedPhotoFile, setEditedPhotoFile] = useState<File | null>(null);
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  useEffect(() => {
    if (user && settings) {
      setEditedName(
        settings.profile.name || user.user_metadata?.full_name || ""
      );
      setEditedPhotoUrl(settings.profile.photoUrl);
      setEditedPhotoFile(null);
      setIsPhotoRemoved(false);
    }
  }, [user, settings]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("user_settings")
        .select("settings")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          const { error: insertError } = await supabase
            .from("user_settings")
            .insert([{ user_id: user.id, settings: defaultSettings }]);

          if (insertError) throw insertError;
          setSettings(defaultSettings);
        } else {
          throw error;
        }
      } else if (data) {
        setSettings({ ...defaultSettings, ...data.settings });
        setTheme(data.settings.appearance?.theme || "system");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<Settings>) => {
    if (!user) return;

    try {
      setIsSaving(true);
      const updatedSettings = { ...settings, ...newSettings };

      const { error } = await supabase
        .from("user_settings")
        .update({ settings: updatedSettings })
        .eq("user_id", user.id);

      if (error) throw error;

      setSettings(updatedSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAppearanceChange = async (
    field: keyof Settings["appearance"],
    value: string
  ) => {
    const newSettings = {
      appearance: {
        ...settings.appearance,
        [field]: value,
      },
    };

    await saveSettings(newSettings);

    if (field === "theme") {
      setTheme(value as "light" | "dark" | "system");
    } else if (field === "fontSize") {
      setFontSize(value as "small" | "medium" | "large");
    }
  };

  const handleNameChange = async (newName: string) => {
    if (!user) return;
    try {
      setIsSaving(true);
      const { data: userData, error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          full_name: newName,
        },
      });
      if (error) throw error;
      if (userData.user) setUser(userData.user);
      setSettings((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          name: newName,
        },
      }));
    } catch (error) {
      console.error("Erro ao atualizar nome:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationChange = async (
    field: keyof Settings["notifications"],
    value: boolean
  ) => {
    await saveSettings({
      notifications: {
        ...settings.notifications,
        [field]: value,
      },
    });
  };

  const handlePrivacyChange = async (
    field: keyof Settings["privacy"],
    value: string | boolean
  ) => {
    await saveSettings({
      privacy: {
        ...settings.privacy,
        [field]: value,
      },
    });
  };

  const handleSecurityChange = async (
    field: keyof Settings["security"],
    value: boolean
  ) => {
    await saveSettings({
      security: {
        ...settings.security,
        [field]: value,
      },
    });
  };

  const handlePreferenceChange = async (
    field: keyof Settings["preferences"],
    value: string
  ) => {
    await saveSettings({
      preferences: {
        ...settings.preferences,
        [field]: value,
      },
    });
  };

  const handleIntegrationChange = async (
    integration: string,
    value: boolean
  ) => {
    try {
      if (integration === "github" && value) {
        // Iniciar fluxo de autenticação OAuth
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "github",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            scopes: "repo",
          },
        });

        if (error) throw error;

        // Atualizar o estado das configurações
        await saveSettings({
          integrations: {
            ...settings.integrations,
            github: true,
          },
        });

        return;
      }

      // Para outras integrações ou desconexão, apenas atualiza o estado
      await saveSettings({
        integrations: {
          ...settings.integrations,
          [integration]: value,
        },
      });
    } catch (error) {
      console.error("Erro ao atualizar integração:", error);
    }
  };

  const handleAccessibilityChange = async (
    field: keyof Settings["accessibility"],
    value: boolean
  ) => {
    await saveSettings({
      accessibility: {
        ...settings.accessibility,
        [field]: value,
      },
    });
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);

      // Verifica o tipo do arquivo
      if (!file.type.startsWith("image/")) {
        return;
      }

      // Verifica o tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      let blobToUpload: Blob;

      // Se for uma imagem HEIC, converte para JPEG
      if (file.type === "image/heic" || file.type === "image/heif") {
        const result = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.7,
        });
        blobToUpload = result as Blob;
      } else {
        // Para outros formatos de imagem, converte para JPEG usando canvas
        const image = new Image();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = URL.createObjectURL(file);
        });

        // Redimensiona a imagem se for muito grande
        const MAX_SIZE = 800;
        let width = image.width;
        let height = image.height;

        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(image, 0, 0, width, height);

        blobToUpload = await new Promise<Blob>((resolve) => {
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
            },
            "image/jpeg",
            0.7
          );
        });
      }

      // Gera um nome único para o arquivo
      const fileName = `${user.id}-${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      // Faz o upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blobToUpload, {
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Obtém a URL pública da imagem
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Atualiza as configurações do usuário
      await saveSettings({
        profile: {
          ...settings.profile,
          photoUrl: publicUrl,
        },
      });

      // Atualizar nome do usuário e sincronizar com AuthContext
      const { data: userData, error: updateError } =
        await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            custom_avatar_url: publicUrl,
          },
        });
      if (updateError) throw updateError;
      if (userData.user) setUser(userData.user);
      setSettings((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          photoUrl: publicUrl,
        },
      }));
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploading(false);
      // Limpa o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleEditedNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleEditedFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setEditedPhotoFile(file);
    setEditedPhotoUrl(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setEditedPhotoUrl(undefined);
    setEditedPhotoFile(null);
    setIsPhotoRemoved(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    let publicUrl = editedPhotoUrl;
    try {
      // Se a foto foi removida, usa a foto do Google
      if (isPhotoRemoved) {
        publicUrl = user.user_metadata?.avatar_url;
        // Atualiza no Supabase
        await saveSettings({
          profile: {
            ...settings.profile,
            name: editedName,
            photoUrl: publicUrl,
          },
        });
        // Atualiza nome/avatar no Auth
        const { data: userData, error: updateError } =
          await supabase.auth.updateUser({
            data: {
              ...user.user_metadata,
              full_name: editedName,
              custom_avatar_url: publicUrl, // Sincroniza custom_avatar_url com avatar_url do Google
            },
          });
        if (updateError) throw updateError;
        if (userData.user) setUser(userData.user); // Atualiza contexto imediatamente
        toast.success("Perfil atualizado com sucesso!");
        setEditedPhotoFile(null);
        setIsPhotoRemoved(false);
        return;
      }
      // Se mudou a foto, faz upload
      else if (editedPhotoFile) {
        let blobToUpload: Blob = editedPhotoFile;
        if (
          editedPhotoFile.type === "image/heic" ||
          editedPhotoFile.type === "image/heif"
        ) {
          const result = await heic2any({
            blob: editedPhotoFile,
            toType: "image/jpeg",
            quality: 0.7,
          });
          blobToUpload = result as Blob;
        } else if (!editedPhotoFile.type.includes("jpeg")) {
          // Converte para jpeg
          const image = new Image();
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
            image.src = URL.createObjectURL(editedPhotoFile);
          });
          const MAX_SIZE = 800;
          let width = image.width;
          let height = image.height;
          if (width > height && width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(image, 0, 0, width, height);
          blobToUpload = await new Promise<Blob>((resolve) => {
            canvas.toBlob(
              (blob) => {
                if (blob) resolve(blob);
              },
              "image/jpeg",
              0.7
            );
          });
        }
        const fileName = `${user.id}-${Date.now()}.jpg`;
        const filePath = `${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, blobToUpload, {
            upsert: true,
            cacheControl: "3600",
          });
        if (uploadError) throw new Error(uploadError.message);
        const {
          data: { publicUrl: uploadedUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);
        publicUrl = uploadedUrl;
      }
      // Atualiza no Supabase
      await saveSettings({
        profile: {
          ...settings.profile,
          name: editedName,
          photoUrl: publicUrl,
        },
      });
      // Atualiza nome/avatar no Auth
      const { data: userData, error: updateError } =
        await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            full_name: editedName,
            custom_avatar_url: publicUrl,
          },
        });
      if (updateError) throw updateError;
      if (userData.user) setUser(userData.user);
      toast.success("Perfil atualizado com sucesso!");
      setEditedPhotoFile(null);
      setIsPhotoRemoved(false);
    } catch (error) {
      toast.error("Erro ao salvar perfil");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "profile", name: "Perfil", icon: User },
    { id: "appearance", name: "Aparência", icon: Eye },
    { id: "notifications", name: "Notificações", icon: Bell },
    { id: "privacy", name: "Privacidade", icon: Shield },
    { id: "security", name: "Segurança", icon: Lock },
    { id: "preferences", name: "Preferências", icon: Clock },
    { id: "integrations", name: "Integrações", icon: Globe },
    { id: "accessibility", name: "Acessibilidade", icon: Keyboard },
    { id: "team", name: "Equipe", icon: Users },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Configurações</h1>

      <div className="grid gap-8">
        <Integrations />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0">
              <nav className="flex flex-col gap-2 py-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group flex items-center gap-4 px-6 py-3 rounded-xl transition-all text-base font-semibold
                        ${
                          isActive
                            ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border-l-4 border-primary-500 shadow"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-700 dark:hover:text-primary-300 border-l-4 border-transparent"
                        }
                      `}
                    >
                      <Icon className="w-6 h-6" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {activeTab === "profile" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Perfil
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Foto de Perfil
                        </label>
                        <div className="mt-1 flex items-center">
                          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {editedPhotoUrl ? (
                              <img
                                src={editedPhotoUrl}
                                alt="Foto de perfil"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                                {editedName?.[0]?.toUpperCase() ||
                                  user?.user_metadata?.full_name?.[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleEditedFileChange}
                            accept="image/*"
                            className="hidden"
                          />
                          <div className="ml-4 flex gap-2">
                            <button
                              onClick={handleUploadClick}
                              disabled={isUploading}
                              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isUploading ? "Enviando..." : "Alterar"}
                            </button>
                            {editedPhotoUrl && (
                              <button
                                onClick={handleRemovePhoto}
                                className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-700 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Remover
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nome
                        </label>
                        <input
                          type="text"
                          value={editedName}
                          onChange={handleEditedNameChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user?.email || ""}
                          readOnly
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                        />
                      </div>
                      <button
                        onClick={handleSaveProfile}
                        disabled={
                          isSaving ||
                          (editedName ===
                            (settings.profile.name ||
                              user?.user_metadata?.full_name ||
                              "") &&
                            !editedPhotoFile &&
                            !isPhotoRemoved)
                        }
                        className="mt-4 px-6 py-2 rounded-md bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? "Salvando..." : "Salvar"}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "appearance" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                      Aparência
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Tema
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() =>
                              handleAppearanceChange("theme", "light")
                            }
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                              settings.appearance.theme === "light"
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700"
                            }`}
                          >
                            <Sun className="w-6 h-6 mb-2 text-gray-700 dark:text-gray-300" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Claro
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              handleAppearanceChange("theme", "dark")
                            }
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                              settings.appearance.theme === "dark"
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700"
                            }`}
                          >
                            <Moon className="w-6 h-6 mb-2 text-gray-700 dark:text-gray-300" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Escuro
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              handleAppearanceChange("theme", "system")
                            }
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                              settings.appearance.theme === "system"
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700"
                            }`}
                          >
                            <Monitor className="w-6 h-6 mb-2 text-gray-700 dark:text-gray-300" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Sistema
                            </span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Tamanho da Fonte
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() =>
                              handleAppearanceChange("fontSize", "small")
                            }
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                              settings.appearance.fontSize === "small"
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700"
                            }`}
                          >
                            <div className="flex items-center justify-center w-6 h-6 mb-2">
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                Aa
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Pequeno
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              handleAppearanceChange("fontSize", "medium")
                            }
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                              settings.appearance.fontSize === "medium"
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700"
                            }`}
                          >
                            <div className="flex items-center justify-center w-6 h-6 mb-2">
                              <span className="text-base text-gray-700 dark:text-gray-300">
                                Aa
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Médio
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              handleAppearanceChange("fontSize", "large")
                            }
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                              settings.appearance.fontSize === "large"
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700"
                            }`}
                          >
                            <div className="flex items-center justify-center w-6 h-6 mb-2">
                              <span className="text-lg text-gray-700 dark:text-gray-300">
                                Aa
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Grande
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "notifications" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Notificações
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            Notificações por Email
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Receba atualizações por email
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleNotificationChange(
                              "email",
                              !settings.notifications.email
                            )
                          }
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            settings.notifications.email
                              ? "bg-primary-600"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              settings.notifications.email
                                ? "translate-x-5"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            Notificações Push
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Receba notificações no navegador
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleNotificationChange(
                              "push",
                              !settings.notifications.push
                            )
                          }
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            settings.notifications.push
                              ? "bg-primary-600"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              settings.notifications.push
                                ? "translate-x-5"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "privacy" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Privacidade
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Visibilidade do Perfil
                        </label>
                        <select
                          value={settings.privacy.profileVisibility}
                          onChange={(e) =>
                            handlePrivacyChange(
                              "profileVisibility",
                              e.target.value
                            )
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="public">Público</option>
                          <option value="private">Privado</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            Compartilhamento de Dados
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Permitir compartilhamento de dados anônimos
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handlePrivacyChange(
                              "dataSharing",
                              !settings.privacy.dataSharing
                            )
                          }
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            settings.privacy.dataSharing
                              ? "bg-primary-600"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              settings.privacy.dataSharing
                                ? "translate-x-5"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "security" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Segurança
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            Autenticação em Dois Fatores
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Adicione uma camada extra de segurança à sua conta
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleSecurityChange(
                              "twoFactorAuth",
                              !settings.security.twoFactorAuth
                            )
                          }
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            settings.security.twoFactorAuth
                              ? "bg-primary-600"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              settings.security.twoFactorAuth
                                ? "translate-x-5"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "preferences" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Preferências
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Idioma
                        </label>
                        <select
                          value={settings.preferences.language}
                          onChange={(e) =>
                            handlePreferenceChange("language", e.target.value)
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="pt-BR">Português (Brasil)</option>
                          <option value="en-US">Inglês (EUA)</option>
                          <option value="es-ES">Espanhol</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Fuso Horário
                        </label>
                        <select
                          value={settings.preferences.timezone}
                          onChange={(e) =>
                            handlePreferenceChange("timezone", e.target.value)
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="America/Sao_Paulo">
                            Brasília (GMT-3)
                          </option>
                          <option value="America/New_York">
                            Nova York (GMT-4)
                          </option>
                          <option value="Europe/London">Londres (GMT+1)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "integrations" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Integrações
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                            <Github className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              GitHub
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Conecte seus repositórios e acompanhe suas
                              contribuições
                            </p>
                          </div>
                        </div>
                        <GithubConnectButton variant="secondary" />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                            <Mail className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              Google
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Acesse seu Gmail, Google Drive e outros serviços
                              Google
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleIntegrationChange(
                              "figma",
                              !settings.integrations.figma
                            )
                          }
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                            settings.integrations.figma
                              ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                              : "bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50"
                          }`}
                        >
                          {settings.integrations.figma
                            ? "Conectado"
                            : "Conectar"}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                            <Figma className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              Figma
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Acompanhe seus designs e protótipos
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleIntegrationChange(
                              "discord",
                              !settings.integrations.discord
                            )
                          }
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                            settings.integrations.discord
                              ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                              : "bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50"
                          }`}
                        >
                          {settings.integrations.discord
                            ? "Conectado"
                            : "Conectar"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "accessibility" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Acessibilidade
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            Alto Contraste
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Melhore a visibilidade dos elementos
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleAccessibilityChange(
                              "highContrast",
                              !settings.accessibility.highContrast
                            )
                          }
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            settings.accessibility.highContrast
                              ? "bg-primary-600"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              settings.accessibility.highContrast
                                ? "translate-x-5"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            Reduzir Movimento
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Reduza animações e transições
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleAccessibilityChange(
                              "reducedMotion",
                              !settings.accessibility.reducedMotion
                            )
                          }
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            settings.accessibility.reducedMotion
                              ? "bg-primary-600"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              settings.accessibility.reducedMotion
                                ? "translate-x-5"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "team" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Equipe
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Membros da Equipe
                        </label>
                        <div className="mt-1">
                          {settings.team.members.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Nenhum membro adicionado
                            </p>
                          ) : (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                              {settings.team.members.map((member) => (
                                <li key={member} className="py-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-900 dark:text-white">
                                      {member}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      {settings.team.roles[member] || "Membro"}
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        Adicionar Membro
                      </button>
                    </div>
                  </div>
                )}

                {isSaving && (
                  <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Salvando configurações...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
