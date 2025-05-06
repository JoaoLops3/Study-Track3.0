import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  integrations: {
    github: boolean;
    google: boolean;
    microsoft: boolean;
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
    defaultRole: 'admin' | 'member';
    notifications: boolean;
    sharing: boolean;
  };
  language: {
    code: string;
    name: string;
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
    microsoft: false,
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
  },
  language: {
    code: 'pt-BR',
    name: 'Português (Brasil)',
  },
  team: {
    members: [],
    roles: {},
    defaultRole: 'member',
    notifications: true,
    sharing: true,
  },
  theme: 'system',
  fontSize: 'medium',
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
          console.log('Usuário não autenticado');
          return;
        }

        // Buscar configurações existentes
        const { data: existingSettings, error: fetchError } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // Configurações não existem, criar novas
            const { error: insertError } = await supabase
              .from('user_settings')
              .insert({
                user_id: user.id,
                settings: defaultSettings
              })
              .select()
              .single();

            if (insertError) {
              console.error('Erro ao criar configurações iniciais:', insertError);
              return;
            }

            setSettings(defaultSettings);
          } else {
            console.error('Erro ao carregar configurações:', fetchError);
          }
          return;
        }

        setSettings(existingSettings.settings);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
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
        console.log('Usuário não autenticado');
        return;
      }

      const updatedSettings = { ...settings, ...newSettings };

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: updatedSettings
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar configurações:', error);
        return;
      }

      setSettings(updatedSettings);
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
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