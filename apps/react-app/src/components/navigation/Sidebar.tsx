import { useState, useEffect, useMemo, memo } from 'react';
import { Link, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { Home, Book, Plus, Folder, File, Settings, PlusCircle, Github, Calendar, Users, Timer, Menu, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import type { Database } from '../../lib/database.types';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../LoadingSpinner';

type Board = Database['public']['Tables']['boards']['Row'];
type Page = Database['public']['Tables']['pages']['Row'];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SidebarItem = memo(({ 
  to, 
  icon: Icon, 
  label, 
  isActive 
}: { 
  to: string; 
  icon: any; 
  label: string; 
  isActive: boolean; 
}) => (
  <Link
    to={to}
    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
      isActive
        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-100'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    {label && <span>{label}</span>}
  </Link>
));

SidebarItem.displayName = 'SidebarItem';

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapse = () => {
    if (window.innerWidth >= 768) {
      setIsCollapsed(!isCollapsed);
    } else {
      onClose();
    }
  };

  const navigationItems = useMemo(() => [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/calendar', icon: Calendar, label: 'Calendário' },
    { to: '/team', icon: Users, label: 'Equipe' },
    { to: '/github', icon: Github, label: 'GitHub' },
    { to: '/pomodoro', icon: Timer, label: 'Pomodoro' },
  ], []);

  useEffect(() => {
    if (user) {
      const fetchUserContent = async () => {
        setIsLoading(true);
        
        try {
          // Fetch recent boards
          const { data: boardsData, error: boardsError } = await supabase
            .from('boards')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(6);
            
          if (boardsError) throw boardsError;
          setBoards(boardsData || []);
          
          // Fetch recent pages
          const { data: pagesData, error: pagesError } = await supabase
            .from('pages')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(6);
            
          if (pagesError) throw pagesError;
          setPages(pagesData || []);
          
        } catch (error) {
          console.error('Error fetching user content:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchUserContent();
    }
  }, [user]);

  const createNewBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBoardTitle.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('boards')
        .insert([
          {
            title: newBoardTitle.trim(),
            owner_id: user.id,
            description: '',
            is_public: false
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        navigate(`/board/${data.id}`);
      }
      
      setNewBoardTitle('');
      setIsCreateBoardOpen(false);
      
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  const createNewPage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPageTitle.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('pages')
        .insert([
          {
            title: newPageTitle.trim(),
            content: {
              type: 'doc',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
            },
            owner_id: user.id,
            is_public: false
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        navigate(`/page/${data.id}`);
      }
      
      setNewPageTitle('');
      setIsCreatePageOpen(false);
      
    } catch (error) {
      console.error('Error creating page:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/team', label: 'Equipe', icon: '👥' },
    { path: '/calendar', label: 'Calendário', icon: '📅' },
    { path: '/github', label: 'GitHub', icon: '💻' },
    { path: '/settings', label: 'Configurações', icon: '⚙️' },
  ];

  return (
    <>
      {/* Overlay para fechar o menu em dispositivos móveis */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Cabeçalho do Sidebar */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <img
                src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
                alt="Avatar"
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.user_metadata?.full_name || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Menu de Navegação */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
                onClick={onClose}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm md:text-base">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};