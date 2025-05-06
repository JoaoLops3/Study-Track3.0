import { useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';

export const useFontSize = () => {
  const { settings, saveSettings } = useContext(SettingsContext);

  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    saveSettings({
      ...settings,
      fontSize: size,
    });
  };

  return {
    fontSize: settings.fontSize,
    setFontSize,
  };
}; 