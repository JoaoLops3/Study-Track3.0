import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Search, ChevronLeft, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

interface HeaderProps {
  onMenuClick: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Header = ({ onMenuClick, onToggleSidebar, isSidebarOpen }: HeaderProps) => {
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
          
          <button
            onClick={onToggleSidebar}
            className="p-2 text-gray-500 dark:text-gray-400 rounded-md hover:text-gray-900 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 hidden md:block"
          >
            <ChevronLeft className={`w-6 h-6 transition-transform duration-200 ${isSidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
          </button>
        </div>
        
        <div className="flex items-center">
          <button className="p-1 mx-2 text-gray-500 dark:text-gray-400 rounded-md hover:text-gray-900 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <Bell className="w-6 h-6" />
          </button>
          
          <div className="relative ml-3">
            <div>
              <button
                className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-label="User menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-user w-8 h-8 text-gray-500 dark:text-gray-400">
                  {settings?.profile?.photoUrl ? (
                    <>
                      <defs>
                        <clipPath id="circleClip">
                          <circle cx="16" cy="16" r="14" />
                        </clipPath>
                      </defs>
                      <image
                        href={settings.profile.photoUrl}
                        x="2"
                        y="2"
                        width="28"
                        height="28"
                        clipPath="url(#circleClip)"
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </>
                  ) : (
                    <>
                      <circle cx="16" cy="16" r="14"></circle>
                      <circle cx="16" cy="13" r="4"></circle>
                      <path d="M9 26.662V25a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1.662"></path>
                    </>
                  )}
                </svg>
                <span className="ml-2 font-medium hidden md:block text-gray-900 dark:text-white">
                  {settings?.profile?.name || user?.email?.split('@')[0]}
                </span>
              </button>
            </div>
            
            {isUserMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                <button
                  onClick={() => navigate('/settings')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Configurações
                </button>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Sair
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