import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, File, Calendar, Users, Settings, Search, Grid, List, Star, Tag, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
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
import { Calendar as UiCalendar } from '../components/ui/calendar';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

type Board = Database['public']['Tables']['boards']['Row'] & {
  is_favorite?: boolean;
  tags?: string[];
};

type Page = Database['public']['Tables']['pages']['Row'] & {
  is_favorite?: boolean;
  tags?: string[];
};

const Dashboard = () => {
  const { user, isLoading: authLoading, googleConnected, signInWithGoogle } = useAuth();
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

    const fetchUserContent = async () => {
      if (!user || authLoading || !mounted) return;
      
      try {
        setIsLoading(true);
        
        const { data: boardsData, error: boardsError } = await supabase
          .from('boards')
          .select('*')
          .or(`owner_id.eq.${user.id},is_public.eq.true`)
          .order('created_at', { ascending: false })
          .limit(6);

        if (boardsError) {
          console.error('Error fetching boards:', boardsError);
          toast.error('Erro ao carregar boards. Por favor, tente novamente.');
          throw boardsError;
        }

        if (mounted) {
          setRecentBoards(boardsData || []);
        }

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

        if (mounted) {
          setRecentPages(pagesData || []);
        }
      } catch (error: any) {
        console.error('Error fetching user content:', error);
        toast.error('Erro ao carregar conteúdo. Por favor, tente novamente.');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUserContent();

    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

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
            created_at: new Date().toISOString()
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

  const handleGoogleConnect = async () => {
    try {
      await signInWithGoogle();
      setGoogleConnected(true);
    } catch (error) {
      console.error('Erro ao conectar com Google:', error);
    }
  };

  return (
    <div className={cn('min-h-screen', settings?.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900')}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        {!googleConnected && (
          <button
            onClick={handleGoogleConnect}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Conectar com Google Calendar
          </button>
        )}
        
        {googleConnected && (
          <div className="bg-green-100 text-green-800 p-4 rounded mb-4">
            Conectado ao Google Calendar
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;