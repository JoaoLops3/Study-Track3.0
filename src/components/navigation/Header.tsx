import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Search, ChevronLeft, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../contexts/SettingsContext';
import { Avatar } from '../../components/ui/Avatar';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
            className="p-2 text-gray-500 dark:text-gray-400 rounded-md hover:text-gray-900 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
      
        <div className="flex items-center space-x-4">
          {/* Botão de Logout */}
          <button
            onClick={handleSignOut}
            className="flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
        </button>
        
          {/* Menu do Usuário */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <Avatar className="w-8 h-8" />
              <span className="ml-2 font-medium hidden md:block text-gray-900 dark:text-white">
                {settings?.profile?.name || user?.email?.split('@')[0]}
              </span>
            </button>
          
            {isUserMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                <button
                  onClick={() => navigate('/settings')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Configurações
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;