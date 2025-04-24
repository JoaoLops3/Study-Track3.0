import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Settings {
  profile: {
    name: string;
    email: string;
    photoUrl?: string;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
  };
  notifications: {
    email: boolean;
    push: boolean;
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
  integrations: {
    github: boolean;
    google: boolean;
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
  saveSettings: (newSettings: Partial<Settings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('user_settings')
            .insert([{ id: user.id, settings: defaultSettings }]);

          if (insertError) throw insertError;
          setSettings(defaultSettings);
        } else {
          throw error;
        }
      } else if (data) {
        setSettings({ ...defaultSettings, ...data.settings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: Partial<Settings>) => {
    if (!user) return;
    
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const { error } = await supabase
        .from('user_settings')
        .update({ settings: updatedSettings })
        .eq('id', user.id);

      if (error) throw error;

      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 