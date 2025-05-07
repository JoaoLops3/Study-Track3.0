import { Menu } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import BotaoTema from "../BotaoTema";

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
          >
            <Menu className="h-6 w-6" />
          </button>
          <img
            src="/logo-v1.png"
            alt="Study Track Logo"
            className="h-8 w-8 md:h-10 md:w-10"
          />
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Study Track
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <BotaoTema />
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm md:text-base bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};
