import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import Sidebar from '../navigation/Sidebar';
import Header from '../navigation/Header';
import { useSettings } from '../../contexts/SettingsContext';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { settings } = useSettings();
  const location = useLocation();

  const handleToggleSidebar = () => {
    if (window.innerWidth >= 768) { // Só permite toggle em desktop
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const handleMenuClick = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Fecha o menu mobile quando a rota muda
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-40 md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-gray-600 dark:bg-gray-900 opacity-75" onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className="absolute inset-y-0 left-0 w-[80%] max-w-xs bg-white dark:bg-gray-800">
          <div className="flex items-center p-4 border-b dark:border-gray-700">
            <div className="flex items-center">
              <img 
                src="/logo-Study-Track.png" 
                alt="Study Track Logo" 
                className="h-6 w-auto mr-2"
              />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Study Track</h2>
            </div>
          </div>
          <Sidebar 
            isOpen={isMobileMenuOpen} 
            onClose={() => setIsMobileMenuOpen(false)} 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          onMenuClick={handleMenuClick}
        />
        
        <main className="relative flex-1 overflow-y-auto focus:outline-none bg-gray-50 dark:bg-gray-900">
          <div className="py-6">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}