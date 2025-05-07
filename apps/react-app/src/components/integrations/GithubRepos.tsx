import React, { useEffect, useState } from "react";
import { useSettings } from "../../contexts/SettingsContext";

// Ajuste do tipo para github
// Pode ser boolean ou objeto { accessToken: string }
type GithubIntegrationType = boolean | { accessToken: string };

interface Repository {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
}

const GithubRepos = () => {
  const { settings } = useSettings();
  const github = settings.integrations.github as GithubIntegrationType;
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setLoading(true);
        setError(null);
        const token =
          typeof github === "object" && github.accessToken
            ? github.accessToken
            : "";
        const response = await fetch("https://api.github.com/user/repos", {
          headers: {
            Authorization: `token ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch repositories");
        }

        const data = await response.json();
        setRepos(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (typeof github === "object" && github.accessToken) {
      fetchRepos();
    }
  }, [github]);

  if (loading) {
    return <div>Loading repositories...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your GitHub Repositories</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {repos.map((repo) => (
          <div key={repo.id} className="p-4 border rounded-lg shadow-sm">
            <h3 className="font-medium">{repo.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {repo.description}
            </p>
            <div className="mt-2 flex items-center space-x-4 text-sm">
              <span>⭐ {repo.stargazers_count}</span>
              <span>{repo.language}</span>
            </div>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              View on GitHub
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GithubRepos;
