import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../ui/Avatar';

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={handleSignOut}
        className="flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sair
      </button>
      <div className="relative">
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center space-x-2 focus:outline-none"
        >
          <Avatar />
          <span className="ml-2 font-medium hidden md:block text-gray-900 dark:text-white">
            {user?.user_metadata?.name || user?.email?.split('@')[0]}
          </span>
        </button>
      </div>
    </div>
  );
}; 