import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MoreHorizontal, Edit2, Trash2, Lock, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import RichTextEditor from '../components/editor/RichTextEditor';
import type { Database } from '../lib/database.types';

type Page = Database['public']['Tables']['pages']['Row'];

const PageView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showPageMenu, setShowPageMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          throw new Error('Page not found');
        }
        
        setPage(data);
        setNewTitle(data.title);
      } catch (error: any) {
        console.error('Error fetching page:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPage();
  }, [id, user]);

  useEffect(() => {
    if (page) {
      document.title = `${page.title} - Study Track`;
    }
    
    return () => {
      document.title = 'Study Track';
    };
  }, [page]);

  const updatePageTitle = async () => {
    if (!page || !newTitle.trim()) return;
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('pages')
        .update({ title: newTitle.trim() })
        .eq('id', page.id)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        setPage(data);
      }
      
      setEditingTitle(false);
    } catch (error) {
      console.error('Error updating page title:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePageContent = async (newContent: any) => {
    if (!page) return;
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('pages')
        .update({ content: newContent })
        .eq('id', page.id)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        setPage(data);
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Error updating page content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePageVisibility = async () => {
    if (!page) return;
    
    try {
      const newIsPublic = !page.is_public;
      
      const { data, error } = await supabase
        .from('pages')
        .update({ is_public: newIsPublic })
        .eq('id', page.id)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        setPage(data);
      }
      
      setShowPageMenu(false);
    } catch (error) {
      console.error('Error updating page visibility:', error);
    }
  };

  const deletePage = async () => {
    if (!page) return;
    
    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', page.id);
        
      if (error) throw error;
      
      navigate('/');
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-t-4 border-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Erro</h2>
        <p className="text-gray-700 mb-6">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Página não encontrada</h2>
        <p className="text-gray-700 mb-6">A página que você está procurando não existe ou você não tem acesso a ela.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          {editingTitle ? (
            <div className="flex items-center">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-3xl font-bold border-b-2 border-primary-500 bg-transparent focus:outline-none mr-2 w-full"
                onBlur={updatePageTitle}
                onKeyDown={(e) => e.key === 'Enter' && updatePageTitle()}
                autoFocus
              />
              <button 
                onClick={updatePageTitle}
                className="p-1 text-primary-600 hover:text-primary-800"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          ) : (
            <h1 
              className="text-3xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 group flex items-center" 
              onClick={() => setEditingTitle(true)}
            >
              {page.title}
              <Edit2 className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h1>
          )}
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center mr-3">
            {page.is_public ? (
              <div className="flex items-center text-gray-600 text-sm bg-gray-100 px-2 py-1 rounded">
                <Globe className="w-4 h-4 mr-1" />
                Público
              </div>
            ) : (
              <div className="flex items-center text-gray-600 text-sm bg-gray-100 px-2 py-1 rounded">
                <Lock className="w-4 h-4 mr-1" />
                Privado
              </div>
            )}
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowPageMenu(!showPageMenu)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {showPageMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={togglePageVisibility}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {page.is_public ? (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Tornar privado
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 mr-2" />
                        Tornar público
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir página
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-2 text-xs text-gray-500 flex justify-between">
        <span>Última edição em {new Date(page.created_at).toLocaleString()}</span>
        {isSaving && <span>Salvando...</span>}
        {lastSaved && !isSaving && <span>Salvo às {lastSaved.toLocaleTimeString()}</span>}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="border dark:border-gray-700 rounded-md overflow-hidden">
        <RichTextEditor
          initialContent={page.content}
          onChange={updatePageContent}
          placeholder="Comece a escrever..."
        />
        </div>
      </div>
      
      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Excluir Página</h2>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir "{page.title}"? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={deletePage}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageView;