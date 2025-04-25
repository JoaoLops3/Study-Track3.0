import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Book, Plus, Folder, File, Settings, PlusCircle, Github } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';
import toast from 'react-hot-toast';

type Board = Database['public']['Tables']['boards']['Row'];
type Page = Database['public']['Tables']['pages']['Row'];

interface SidebarProps {
  onClose: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo e Nome do Site */}
      <div className="flex items-center justify-center p-4 border-b dark:border-gray-700">
        <img 
          src="/logo-Study-Track.png" 
          alt="Study Track Logo" 
          className="h-8 w-auto mr-2"
        />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Study Track</h2>
      </div>

      <nav className="flex-1 px-4 mt-4 overflow-y-auto">
        <a
          className="flex items-center px-3 py-2 mb-2 rounded-md transition-colors bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-100"
          href="/"
        >
          <Home className="w-5 h-5 mr-3" />
          <span>Dashboard</span>
        </a>
        
        <a
          className="flex items-center px-3 py-2 mb-2 rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          href="/github-repos"
        >
          <Github className="w-5 h-5 mr-3" />
          <span>Meus Repositórios</span>
        </a>
        
        {/* Boards Section */}
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
        
        {/* Pages Section */}
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
      
      <div className="p-4 border-t">
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center px-3 py-2 w-full text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Settings className="w-5 h-5 mr-3" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;