import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <button
            className="mr-2 flex items-center md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center"
          >
            <span className="sr-only">Voltar</span>
          </button>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};