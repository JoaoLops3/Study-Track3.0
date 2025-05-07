import { useState, useEffect } from "react";
import { useSettings } from "../../contexts/SettingsContext";
import { Card, CardContent } from "../ui/card";
import { toast } from "sonner";

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
}

interface GithubIntegration {
  accessToken: string;
}

interface GithubReposProps {
  // Add props if needed
}

const GithubRepos = ({}: GithubReposProps) => {
  const { settings } = useSettings();
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRepos = async () => {
      const githubIntegration = settings?.integrations?.github;
      if (
        !githubIntegration ||
        typeof githubIntegration !== "object" ||
        !("accessToken" in githubIntegration)
      )
        return;
      const { accessToken } = githubIntegration as GithubIntegration;
      setLoading(true);
      try {
        const response = await fetch("https://api.github.com/user/repos", {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch repos");

        const data = await response.json();
        setRepos(data);
      } catch (error) {
        console.error("Error fetching repos:", error);
        toast.error("Erro ao carregar repositórios");
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [settings?.integrations?.github]);

  if (loading) {
    return <div>Carregando repositórios...</div>;
  }

  return (
    <div className="space-y-4">
      {repos.map((repo) => (
        <Card key={repo.id}>
          <CardContent className="p-4">
            <h3 className="font-medium">{repo.name}</h3>
            <p className="text-sm text-gray-500">{repo.description}</p>
            <div className="flex items-center mt-2 space-x-4 text-sm">
              <span>⭐ {repo.stargazers_count}</span>
              <span>{repo.language}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GithubRepos;
