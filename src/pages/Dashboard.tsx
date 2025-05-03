import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, File, Settings, Search, Grid, List, Star, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import toast from 'react-hot-toast';
import Skeleton from '../components/ui/Skeleton';
import Tooltip from '../components/ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon } from 'lucide-react';
import { cn } from '../utils';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

type Board = Database['public']['Tables']['boards']['Row'] & {
  is_favorite?: boolean;
  tags?: string[];
};

type Page = Database['public']['Tables']['pages']['Row'] & {
  is_favorite?: boolean;
  tags?: string[];
};

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { settings } = useSettings();
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
                          (typeof page.content === 'object' && page.content !== null && 
                          'content' in page.content && Array.isArray((page.content as any).content) && 
                          (page.content as any).content[0]?.content?.[0]?.text?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.some(tag => page.tags?.includes(tag));
      const matchesFavorites = !showFavorites || page.is_favorite;
      return matchesSearch && matchesTags && matchesFavorites;
    });
  }, [recentPages, searchQuery, selectedTags, showFavorites]);

  // Toggle favorito
  const toggleFavorite = async (type: 'board' | 'page', id: string, is_favorite: boolean | undefined) => {
    try {
      if (!user) return;
      
      const table = type === 'board' ? 'boards' : 'pages';
      const currentItems = type === 'board' ? recentBoards : recentPages;
      const setItems = type === 'board' ? setRecentBoards : setRecentPages;
      
      const item = currentItems.find(item => item.id === id);
      if (!item) return;

      // Primeiro, verificamos se o registro pertence ao usuário
      const { data: existingItem, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar item:', fetchError);
        throw fetchError;
      }

      if (!existingItem) {
        throw new Error('Item não encontrado ou não autorizado');
      }

      // Garantir que is_favorite seja um booleano
      const newFavoriteStatus = is_favorite === undefined ? true : !is_favorite;

      // Agora fazemos o update
      const { error: updateError } = await supabase
        .from(table)
        .update({ 
          is_favorite: newFavoriteStatus
        })
        .eq('id', id);

      if (updateError) throw updateError;

      if (type === 'board') {
        setRecentBoards(currentItems.map(item => 
          item.id === id ? { ...item, is_favorite: newFavoriteStatus } : item
        ) as Board[]);
      } else {
        setRecentPages(currentItems.map(item => 
          item.id === id ? { ...item, is_favorite: newFavoriteStatus } : item
        ) as Page[]);
      }
      
      toast.success('Favorito atualizado com sucesso!');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erro ao atualizar favorito');
    }
  };

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const fetchUserContent = async () => {
      if (!user || !mounted) return;
      
      try {
        setIsLoading(true);
        
        // Buscar boards e pages em paralelo
        const [boardsResponse, pagesResponse] = await Promise.all([
          supabase
            .from('boards')
            .select('*')
            .or(`owner_id.eq.${user.id},is_public.eq.true`)
            .order('created_at', { ascending: false })
            .limit(6),
          supabase
            .from('pages')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(6)
        ]);

        if (boardsResponse.error) {
          console.error('Error fetching boards:', boardsResponse.error);
          throw boardsResponse.error;
        }

        if (pagesResponse.error) {
          console.error('Error fetching pages:', pagesResponse.error);
          throw pagesResponse.error;
        }

        if (mounted) {
          setRecentBoards(boardsResponse.data || []);
          setRecentPages(pagesResponse.data || []);
        }
      } catch (error: any) {
        console.error('Error fetching user content:', error);
        
        // Tentar novamente se ainda não atingiu o limite de tentativas
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Tentativa ${retryCount} de ${maxRetries}`);
          setTimeout(fetchUserContent, 1000 * retryCount); // Backoff exponencial
        } else {
          toast.error('Erro ao carregar conteúdo. Por favor, recarregue a página.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    if (user && !authLoading) {
      fetchUserContent();
    } else if (!authLoading) {
      setIsLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  const createNewBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const newBoard = {
        title: newBoardTitle,
        owner_id: user.id,
        tags: newBoardTags.split(',').filter(tag => tag.trim()).map(tag => tag.trim()),
        is_favorite: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('boards')
        .insert([newBoard])
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
      toast.error('Erro ao criar board. Por favor, tente novamente.');
    }
  };

  const createNewPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const newPage = {
        title: newPageTitle,
        owner_id: user.id,
        tags: newPageTags.split(',').filter(tag => tag.trim()).map(tag => tag.trim()),
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
      };

      const { data, error } = await supabase
        .from('pages')
        .insert([newPage])
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

  // Renderização condicional para estado de carregamento
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-t-2 border-b-2 border-primary-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Bem-vindo ao Study Track</h1>
        <p className="text-gray-600 mb-8">Por favor, faça login para continuar.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Ir para Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-white">
      <div className="container mx-auto px-4 py-8 dark:text-white text-gray-900">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold dark:text-white text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4"></div>
        </div>

        {/* Barra de pesquisa e filtros */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search absolute left-3 top-1/2 transform -translate-y-1/2 dark:text-gray-400 text-gray-500">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 border-gray-300 hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star w-5 h-5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>Favoritos</span>
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-lg border dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 border-gray-300 hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list w-5 h-5">
                <line x1="8" x2="21" y1="6" y2="6"></line>
                <line x1="8" x2="21" y1="12" y2="12"></line>
                <line x1="8" x2="21" y1="18" y2="18"></line>
                <line x1="3" x2="3.01" y1="6" y2="6"></line>
                <line x1="3" x2="3.01" y1="12" y2="12"></line>
                <line x1="3" x2="3.01" y1="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Tags */}
        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTags(prev => 
                  prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                )}
                className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm dark:bg-gray-800 dark:text-gray-300 bg-gray-100 text-gray-700 border-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tag w-4 h-4">
                  <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path>
                  <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle>
                </svg>
                <span>{tag}</span>
              </button>
            ))}
          </div>
        )}

        {/* Boards */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold dark:text-white text-gray-900">Boards</h2>
            <Button
              onClick={() => setIsCreatingBoard(true)}
              className="flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus w-5 h-5">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              <span>Novo Board</span>
            </Button>
          </div>

          {isCreatingBoard && (
            <form onSubmit={createNewBoard} className={cn(
              "mb-4 p-4 border rounded-lg",
              settings?.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
            )}>
              <input
                type="text"
                placeholder="Título do Board"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                className={cn(
                  "w-full mb-2 p-2 border rounded",
                  settings?.theme === 'dark'
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                )}
                required
              />
              <input
                type="text"
                placeholder="Tags (separadas por vírgula)"
                value={newBoardTags}
                onChange={(e) => setNewBoardTags(e.target.value)}
                className={cn(
                  "w-full mb-2 p-2 border rounded",
                  settings?.theme === 'dark'
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button onClick={() => setIsCreatingBoard(false)} variant="outline">
                  Cancelar
                </Button>
                <Button type="submit">Criar</Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-32" />
              ))}
            </div>
          ) : filteredBoards.length > 0 ? (
            <div className={cn(
              viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"
            )}>
              {filteredBoards.map((board) => (
                <Card
                  key={board.id}
                  className="relative group hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200"
                >
                  <button
                    onClick={() => toggleFavorite('board', board.id, board.is_favorite)}
                    className="absolute top-2 right-2 p-1 rounded-full dark:hover:bg-gray-700 hover:bg-gray-100"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill={board.is_favorite ? "currentColor" : "none"}
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className={cn(
                        "w-5 h-5",
                        board.is_favorite ? "text-yellow-400" : "dark:text-gray-400 text-gray-500"
                      )}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </button>
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => navigate(`/board/${board.id}`)}
                  >
                    <h3 className="text-lg font-semibold mb-2 dark:text-white text-gray-900">{board.title}</h3>
                    {board.tags && board.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {board.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-full text-sm dark:bg-gray-700 dark:text-gray-300 bg-gray-100 text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className={cn(
              "text-center py-8",
              settings?.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              Nenhum board encontrado
            </div>
          )}
        </div>

        {/* Pages */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold dark:text-white text-gray-900">Páginas</h2>
            <Button
              onClick={() => setIsCreatingPage(true)}
              className="flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus w-5 h-5">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              <span>Nova Página</span>
            </Button>
          </div>

          {isCreatingPage && (
            <form onSubmit={createNewPage} className={cn(
              "mb-4 p-4 border rounded-lg",
              "dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-300"
            )}>
              <input
                type="text"
                placeholder="Título da Página"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                className={cn(
                  "w-full mb-2 p-2 border rounded",
                  "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400",
                  "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                )}
                required
              />
              <input
                type="text"
                placeholder="Tags (separadas por vírgula)"
                value={newPageTags}
                onChange={(e) => setNewPageTags(e.target.value)}
                className={cn(
                  "w-full mb-2 p-2 border rounded",
                  "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400",
                  "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button onClick={() => setIsCreatingPage(false)} variant="outline" className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
                  Cancelar
                </Button>
                <Button type="submit" className="dark:bg-primary-600 dark:hover:bg-primary-700">
                  Criar
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-32" />
              ))}
            </div>
          ) : filteredPages.length > 0 ? (
            <div className={cn(
              viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"
            )}>
              {filteredPages.map((page) => (
                <Card
                  key={page.id}
                  className="relative group hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200"
                >
                  <button
                    onClick={() => toggleFavorite('page', page.id, page.is_favorite)}
                    className="absolute top-2 right-2 p-1 rounded-full dark:hover:bg-gray-700 hover:bg-gray-100"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill={page.is_favorite ? "currentColor" : "none"}
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className={cn(
                        "w-5 h-5",
                        page.is_favorite ? "text-yellow-400" : "dark:text-gray-400 text-gray-500"
                      )}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </button>
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => navigate(`/page/${page.id}`)}
                  >
                    <h3 className="text-lg font-semibold mb-2 dark:text-white text-gray-900">{page.title}</h3>
                    {page.tags && page.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {page.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-full text-sm dark:bg-gray-700 dark:text-gray-300 bg-gray-100 text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className={cn(
              "text-center py-8",
              settings?.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              Nenhuma página encontrada
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;