import React, { useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

// Ajuste do tipo para github
// Pode ser boolean ou objeto { accessToken: string }
type GithubIntegrationType = boolean | { accessToken: string };

const GithubRepos = () => {
  const { settings } = useSettings();
  const github = settings.integrations.github as GithubIntegrationType;

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const token = typeof github === 'object' && github.accessToken ? github.accessToken : '';
        const response = await fetch("https://api.github.com/user/repos", {
          headers: {
            Authorization: `token ${token}`,
          },
        });
        // ... existing code ...
      } catch (error) {
        // ... existing code ...
      } finally {
        // ... existing code ...
      }
    };
    if (typeof github === 'object' && github.accessToken) {
      fetchRepos();
    }
  }, [github]);

  return (
    // ... existing code ...
  );
};

export default GithubRepos; 