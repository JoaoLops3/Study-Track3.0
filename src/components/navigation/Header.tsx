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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6">
      <div className="flex items-center">
        <button 
          className="p-1 text-gray-500 dark:text-gray-400 rounded-md md:hidden focus:outline-none focus:ring-2 focus:ring-primary-500"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex items-center">
          <img 
            src="/logo-Study-Track.png" 
            alt="Study Track Logo" 
            className="h-6 w-auto mr-2"
          />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Study Track</h2>
        </div>
        
        <button
          className="hidden md:block p-1 mx-3 text-gray-500 dark:text-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        
        <div className="relative max-w-md w-full hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-gray-50 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-white"
            placeholder="Search..."
          />
        </div>
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
                {user?.email?.split('@')[0]}
              </span>
            </button>
          </div>
          
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
              <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
                {user?.email}
              </div>
              <button
                onClick={handleSignOut}
                className="flex w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;