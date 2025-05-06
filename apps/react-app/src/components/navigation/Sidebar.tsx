import { useState, useEffect, useMemo, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Book, Plus, Folder, File, Settings, PlusCircle, Github, Calendar, Users, Timer, Menu } from 'lucide-react';
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

  return (
    <>
      {/* Overlay para mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`fixed left-0 top-0 h-full min-h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:relative md:z-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="flex flex-col h-full min-h-screen">
          <div className={`flex items-center justify-between p-4 border-b dark:border-gray-700`}>
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => navigate('/')}
            >
              <img 
                src="/logo-Study-Track.png" 
                alt="Study Track Logo" 
                className="h-8 w-8 mr-2" 
              />
              {/* Nome só aparece se não estiver colapsado E não for mobile */}
              {(!isCollapsed || !isMobile) && (
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Study Track</h2>
              )}
            </div>
            {/* Botão de collapse só no desktop */}
            <button
              onClick={toggleCollapse}
              className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md"
            >
              <span className="sr-only">{isCollapsed ? 'Expandir' : 'Recolher'}</span>
            </button>
            {/* Botão de fechar sidebar no mobile */}
            {isMobile && isOpen && (
              <button
                onClick={onClose}
                className="md:hidden p-2 ml-2 text-gray-500 dark:text-gray-400 rounded-md hover:text-gray-900 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <span className="sr-only">Fechar</span>
              </button>
            )}
          </div>

          {(!isCollapsed || !window.matchMedia('(min-width: 768px)').matches) && (
            <>
              <nav className="flex-1 px-4 mt-4 overflow-y-auto">
                {navigationItems.map((item) => (
                  <SidebarItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={!isCollapsed ? item.label : ''}
                    isActive={location.pathname === item.to}
                  />
                ))}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2 group">
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Boards</h3>
                    <button 
                      onClick={() => setIsCreateBoardOpen(!isCreateBoardOpen)}
                      className="invisible group-hover:visible p-1 text-gray-400 rounded hover:text-gray-600 focus:outline-none"
                      aria-label="Add board"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {isCreateBoardOpen && (
                    <form onSubmit={createNewBoard} className="mb-3 px-3">
                      <input
                        type="text"
                        placeholder="Board title"
                        value={newBoardTitle}
                        onChange={(e) => setNewBoardTitle(e.target.value)}
                        className="w-full p-2 mb-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setIsCreateBoardOpen(false)}
                          className="px-3 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 text-xs text-white bg-primary-600 rounded hover:bg-primary-700"
                        >
                          Create
                        </button>
                      </div>
                    </form>
                  )}
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-t-2 border-primary-600 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {boards.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-gray-500 italic">
                          No boards yet
                        </li>
                      ) : (
                        boards.map((board) => (
                          <li key={board.id}>
                            <Link
                              to={`/board/${board.id}`}
                              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                location.pathname === `/board/${board.id}`
                                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-100'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                              onClick={onClose}
                            >
                              <Folder className="w-4 h-4 mr-3 flex-shrink-0" />
                              <span className="truncate">{board.title}</span>
                            </Link>
                          </li>
                        ))
                      )}
                      <li>
                        <button
                          onClick={() => setIsCreateBoardOpen(!isCreateBoardOpen)}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <PlusCircle className="w-4 h-4 mr-3 text-gray-500" />
                          <span>New Board</span>
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2 group">
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Pages</h3>
                    <button 
                      onClick={() => setIsCreatePageOpen(!isCreatePageOpen)}
                      className="invisible group-hover:visible p-1 text-gray-400 rounded hover:text-gray-600 focus:outline-none"
                      aria-label="Add page"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {isCreatePageOpen && (
                    <form onSubmit={createNewPage} className="mb-3 px-3">
                      <input
                        type="text"
                        placeholder="Page title"
                        value={newPageTitle}
                        onChange={(e) => setNewPageTitle(e.target.value)}
                        className="w-full p-2 mb-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setIsCreatePageOpen(false)}
                          className="px-3 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 text-xs text-white bg-primary-600 rounded hover:bg-primary-700"
                        >
                          Create
                        </button>
                      </div>
                    </form>
                  )}
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-t-2 border-primary-600 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {pages.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-gray-500 italic">
                          No pages yet
                        </li>
                      ) : (
                        pages.map((page) => (
                          <li key={page.id}>
                            <Link
                              to={`/page/${page.id}`}
                              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                location.pathname === `/page/${page.id}`
                                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-100'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                              onClick={onClose}
                            >
                              <File className="w-4 h-4 mr-3 flex-shrink-0" />
                              <span className="truncate">{page.title}</span>
                            </Link>
                          </li>
                        ))
                      )}
                      <li>
                        <button
                          onClick={() => setIsCreatePageOpen(!isCreatePageOpen)}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <PlusCircle className="w-4 h-4 mr-3 text-gray-500" />
                          <span>New Page</span>
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              </nav>
              <div className="p-4 border-t mt-auto">
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center px-3 py-2 w-full text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Settings className="w-5 h-5 mr-3" />
                  <span>Configurações</span>
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};