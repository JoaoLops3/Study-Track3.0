import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  integrations: {
    github: boolean;
    google: boolean;
  };
  notifications: {
    email: boolean;
    push: boolean;
  };
  profile: {
    name: string;
    email: string;
    avatar?: string;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
  };
  privacy: {
    profileVisibility: 'public' | 'private';
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
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
  };
  team: {
    members: string[];
    roles: Record<string, string>;
  };
}

const defaultSettings: Settings = {
  profile: {
    name: '',
    email: '',
  },
  appearance: {
    theme: 'system',
    fontSize: 'medium',
  },
  notifications: {
    email: true,
    push: true,
  },
  privacy: {
    profileVisibility: 'private',
    dataSharing: false,
  },
  security: {
    twoFactorAuth: false,
    loginAlerts: true,
  },
  preferences: {
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
  },
  integrations: {
    github: false,
    google: false,
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

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setSettings(defaultSettings);
          setIsLoading(false);
          return;
        }

        // Primeiro, tenta buscar as configurações existentes
        const { data, error } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Se não existir configuração, cria uma nova
            const { error: insertError } = await supabase
              .from('user_settings')
              .insert([{ 
                user_id: user.id, 
                settings: defaultSettings 
              }])
              .select()
              .single();

            if (insertError) {
              // Se der erro de duplicação, tenta buscar novamente
              if (insertError.code === '23505') {
                const { data: retryData, error: retryError } = await supabase
                  .from('user_settings')
                  .select('settings')
                  .eq('user_id', user.id)
                  .single();

                if (retryError) {
                  console.error('Erro ao buscar configurações após tentativa de inserção:', retryError);
                  throw retryError;
                }

                if (retryData) {
                  setSettings({
                    ...defaultSettings,
                    ...retryData.settings
                  });
                } else {
                  setSettings(defaultSettings);
                }
              } else {
                console.error('Erro ao criar configurações iniciais:', insertError);
                throw insertError;
              }
            } else {
              setSettings(defaultSettings);
            }
          } else {
            console.error('Erro ao buscar configurações:', error);
            throw error;
          }
        } else if (data) {
          setSettings({
            ...defaultSettings,
            ...data.settings
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast.error('Erro ao carregar configurações');
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const updatedSettings = {
        ...settings,
        ...newSettings
      };

      // Primeiro, verificar se já existe uma configuração
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let error;
      if (existingSettings) {
        // Se existir, atualizar
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({ settings: updatedSettings })
          .eq('user_id', user.id);
        error = updateError;
      } else {
        // Se não existir, criar nova
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            settings: updatedSettings
          });
        error = insertError;
      }

      if (error) throw error;

      setSettings(updatedSettings);
      toast.success('Configurações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      toast.error('Erro ao atualizar configurações');
      throw error;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
} 