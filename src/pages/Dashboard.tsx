import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, File, Calendar, Users, Settings, Search, Grid, List, Star, Tag, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import toast from 'react-hot-toast';
import Skeleton from '../components/ui/Skeleton';
import Tooltip from '../components/ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon } from 'lucide-react';
import { cn } from '../lib/utils';

type Board = Database['public']['Tables']['boards']['Row'] & {
  is_favorite?: boolean;
  tags?: string[];
};

type Page = Database['public']['Tables']['pages']['Row'] & {
  is_favorite?: boolean;
  tags?: string[];
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentBoards, setRecentBoards] = useState<Board[]>([]);
  const [recentPages, setRecentPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardTags, setNewBoardTags] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageTags, setNewPageTags] = useState('');
  
  // Novos estados
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  // Tags disponíveis
  const availableTags = useMemo(() => {
    const allTags = new Set<string>();
    [...recentBoards, ...recentPages].forEach(item => {
      item.tags?.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags);
  }, [recentBoards, recentPages]);

  // Filtrar boards e pages
  const filteredBoards = useMemo(() => {
    return recentBoards.filter(board => {
      const matchesSearch = board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          board.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.some(tag => board.tags?.includes(tag));
      const matchesFavorites = !showFavorites || board.is_favorite;
      return matchesSearch && matchesTags && matchesFavorites;
    });
  }, [recentBoards, searchQuery, selectedTags, showFavorites]);

  const filteredPages = useMemo(() => {
    return recentPages.filter(page => {
      const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          page.content?.content?.[0]?.content?.[0]?.text?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.some(tag => page.tags?.includes(tag));
      const matchesFavorites = !showFavorites || page.is_favorite;
      return matchesSearch && matchesTags && matchesFavorites;
    });
  }, [recentPages, searchQuery, selectedTags, showFavorites]);

  // Toggle favorito
  const toggleFavorite = async (type: 'board' | 'page', id: string, is_favorite: boolean | undefined) => {
    try {
      const table = type === 'board' ? 'boards' : 'pages';
      const currentItems = type === 'board' ? recentBoards : recentPages;
      const setItems = type === 'board' ? setRecentBoards : setRecentPages;
      
      const item = currentItems.find(item => item.id === id);
      if (!item) return;

      const { error } = await supabase
        .from(table)
        .update({ 
          is_favorite: !is_favorite
        })
        .eq('id', id)
        .eq('owner_id', user?.id);

      if (error) throw error;

      setItems(currentItems.map(item => 
        item.id === id ? { ...item, is_favorite: !is_favorite } : item
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erro ao atualizar favorito');
    }
  };

  useEffect(() => {
    if (user) {
      const fetchUserContent = async () => {
        setIsLoading(true);
        
        try {
          console.log('Fetching boards for user:', user.id);
          
          // Fetch recent boards
          const { data: boardsData, error: boardsError } = await supabase
            .from('boards')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(6);
            
          if (boardsError) {
            console.error('Error fetching boards:', boardsError);
            toast.error('Erro ao carregar boards. Por favor, tente novamente.');
            throw boardsError;
          }
          
          console.log('Boards fetched:', boardsData?.length || 0);
          setRecentBoards(boardsData || []);
          
          // Fetch recent pages
          const { data: pagesData, error: pagesError } = await supabase
            .from('pages')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(6);
            
          if (pagesError) {
            console.error('Error fetching pages:', pagesError);
            toast.error('Erro ao carregar páginas. Por favor, tente novamente.');
            throw pagesError;
          }
          
          console.log('Pages fetched:', pagesData?.length || 0);
          setRecentPages(pagesData || []);
          
        } catch (error: any) {
          console.error('Error fetching user content:', error);
          toast.error('Erro ao carregar conteúdo. Por favor, tente novamente.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchUserContent();
    } else {
      console.log('No user found, skipping fetch');
      setIsLoading(false);
    }
  }, [user]);

  const createNewBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('boards')
        .insert([
          {
            title: newBoardTitle,
            owner_id: user.id,
            tags: newBoardTags.split(',').map(tag => tag.trim()),
            is_favorite: false,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setRecentBoards((prev) => [data, ...prev]);
      setNewBoardTitle('');
      setNewBoardTags('');
      setIsCreatingBoard(false);
      navigate(`/board/${data.id}`);
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  const createNewPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pages')
        .insert([
          {
            title: newPageTitle,
            owner_id: user.id,
            tags: newPageTags.split(',').map(tag => tag.trim()),
            is_favorite: false,
            created_at: new Date().toISOString(),
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: []
                }
              ]
            }
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setRecentPages((prev) => [data, ...prev]);
      setNewPageTitle('');
      setNewPageTags('');
      setIsCreatingPage(false);
      navigate(`/page/${data.id}`);
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error('Erro ao criar página. Por favor, tente novamente.');
    }
  };

  const handleCalendarClick = () => {
    navigate('/calendar');
  };

  const handleTeamClick = () => {
    navigate('/team');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <motion.div 
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Tooltip content="Create a new board">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreatingBoard(true)}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Board
            </motion.button>
          </Tooltip>
          
          <Tooltip content="Create a new page">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreatingPage(true)}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Page
            </motion.button>
          </Tooltip>
        </div>
      </motion.div>

      {/* Barra de ferramentas */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar boards e pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Tooltip content="Visualização em grade" placement="bottom" delayDuration={200}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-primary-100 dark:bg-primary-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <Grid className="h-5 w-5" />
            </motion.button>
          </Tooltip>
          
          <Tooltip content="Visualização em lista" placement="bottom" delayDuration={200}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-primary-100 dark:bg-primary-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <List className="h-5 w-5" />
            </motion.button>
          </Tooltip>

          <Tooltip content="Mostrar favoritos" placement="bottom" delayDuration={200}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFavorites(!showFavorites)}
              className={`p-2 rounded-md ${
                showFavorites
                  ? 'bg-yellow-100 dark:bg-yellow-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {showFavorites ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-yellow-500"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ) : (
                <Star className="h-5 w-5 text-gray-400" />
              )}
            </motion.button>
          </Tooltip>
        </div>
      </motion.div>

      {/* Tags */}
      {availableTags.length > 0 && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {availableTags.map(tag => (
            <motion.button
              key={tag}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedTags(prev => 
                  prev.includes(tag) 
                    ? prev.filter(t => t !== tag)
                    : [...prev, tag]
                );
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                selectedTags.includes(tag)
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <Tag className="h-4 w-4" />
              {tag}
            </motion.button>
          ))}
        </motion.div>
      )}

      {isLoading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Skeleton loading for Quick Actions */}
          <div>
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Skeleton className="h-32" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Skeleton loading for Recent Boards */}
          <div>
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(3).fill(0).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Skeleton className="h-48" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Skeleton loading for Recent Pages */}
          <div>
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(3).fill(0).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Skeleton className="h-48" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Quick Actions */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AnimatePresence>
                <motion.button
                  key="new-board-action"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCreatingBoard(true)}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col items-center"
                >
                  <Folder className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-3" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">New Board</span>
                </motion.button>
                
                <motion.button
                  key="new-page-action"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCreatingPage(true)}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col items-center"
                >
                  <File className="h-8 w-8 text-secondary-600 dark:text-secondary-400 mb-3" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">New Page</span>
                </motion.button>
                
                <motion.button
                  key="calendar-action"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCalendarClick}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col items-center"
                >
                  <Calendar className="h-8 w-8 text-orange-500 dark:text-orange-400 mb-3" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Calendar</span>
                </motion.button>
                
                <motion.button
                  key="team-action"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTeamClick}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col items-center"
                >
                  <Users className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-3" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Team</span>
                </motion.button>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Recent Boards */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10"
          >
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Recent Boards</h2>
            <div className={cn(
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'flex flex-col space-y-2'
            )}>
              <AnimatePresence>
                {filteredBoards.map((board) => (
                  <motion.div
                    key={board.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cn(
                      "bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow",
                      viewMode === 'grid' ? 'p-4' : 'p-3'
                    )}
                  >
                    <div className={cn(
                      "flex items-start",
                      viewMode === 'grid' ? 'flex-col' : 'flex-row justify-between'
                    )}>
                      <div className={cn(
                        "flex items-start",
                        viewMode === 'grid' ? 'w-full justify-between mb-2' : 'flex-1'
                      )}>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {board.title}
                        </h3>
                        <button
                          onClick={() => toggleFavorite('board', board.id, board.is_favorite)}
                          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ml-2"
                        >
                          {board.is_favorite ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-5 w-5 text-yellow-500"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ) : (
                            <Star className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {board.tags && board.tags.length > 0 && (
                        <div className={cn(
                          "flex flex-wrap gap-1",
                          viewMode === 'grid' ? 'mb-2' : 'mx-4 flex-1'
                        )}>
                          {board.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => navigate(`/board/${board.id}`)}
                        className={cn(
                          "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300",
                          viewMode === 'list' && "ml-2"
                        )}
                      >
                        Abrir
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Recent Pages */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Recent Pages</h2>
            <div className={cn(
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'flex flex-col space-y-2'
            )}>
              <AnimatePresence>
                {filteredPages.map((page) => (
                  <motion.div
                    key={page.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cn(
                      "bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow",
                      viewMode === 'grid' ? 'p-4' : 'p-3'
                    )}
                  >
                    <div className={cn(
                      "flex items-start",
                      viewMode === 'grid' ? 'flex-col' : 'flex-row justify-between'
                    )}>
                      <div className={cn(
                        "flex items-start",
                        viewMode === 'grid' ? 'w-full justify-between mb-2' : 'flex-1'
                      )}>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {page.title}
                        </h3>
                        <button
                          onClick={() => toggleFavorite('page', page.id, page.is_favorite)}
                          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ml-2"
                        >
                          {page.is_favorite ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-5 w-5 text-yellow-500"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ) : (
                            <Star className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {page.tags && page.tags.length > 0 && (
                        <div className={cn(
                          "flex flex-wrap gap-1",
                          viewMode === 'grid' ? 'mb-2' : 'mx-4 flex-1'
                        )}>
                          {page.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => navigate(`/page/${page.id}`)}
                        className={cn(
                          "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300",
                          viewMode === 'list' && "ml-2"
                        )}
                      >
                        Abrir
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Create Board Modal */}
      {isCreatingBoard && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-semibold mb-4">Criar Novo Quadro</h2>
            <form onSubmit={createNewBoard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite o título do quadro"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={newBoardTags}
                  onChange={(e) => setNewBoardTags(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: trabalho, pessoal, projeto"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingBoard(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Criar
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Create Page Modal */}
      {isCreatingPage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full max-w-md mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Criar nova página
              </h3>
              <button
                onClick={() => setIsCreatingPage(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={createNewPage}>
              <div className="mb-4">
                <label
                  htmlFor="pageTitle"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Título
                </label>
                <input
                  type="text"
                  id="pageTitle"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="pageTags"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  id="pageTags"
                  value={newPageTags}
                  onChange={(e) => setNewPageTags(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="ex: notas, ideias, tarefas"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingPage(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Criar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;