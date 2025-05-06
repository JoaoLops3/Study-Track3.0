import { useContext } from 'react';
import { SettingsContext, Settings } from '../contexts/SettingsContext';

export const useFontSize = () => {
  const { settings, updateSettings } = useContext(SettingsContext);

  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    updateSettings({
      ...settings,
      fontSize: size,
    });
  };

  return {
    fontSize: settings.fontSize,
    setFontSize,
  };
}; 