import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Plus, MoreHorizontal, Edit2, Trash2, Lock, Globe, Share2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import CardItem from '../components/board/CardItem';
import CardModal from '../components/board/CardModal';
import type { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../components/LoadingSpinner';

type Board = Database['public']['Tables']['boards']['Row'];
type Column = Database['public']['Tables']['columns']['Row'];
type Card = Database['public']['Tables']['cards']['Row'];

const ITEMS_PER_PAGE = 20;

const Board = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);
  const [editingBoardTitle, setEditingBoardTitle] = useState(false);
  const [editingBoardDescription, setEditingBoardDescription] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBoardData = useCallback(async () => {
    if (!id || !user) return;
    
    try {
      setLoading(true);
      
      // Fetch board details
      const { data: boardData } = await supabase
        .from('boards')
        .select(`
          *,
          columns:board_columns(*),
          cards:board_cards(*)
        `)
        .eq('id', id)
        .single();
        
      if (boardData) {
        setBoard(boardData);
        setNewBoardTitle(boardData.title);
        setNewBoardDescription(boardData.description || '');
        
        setColumns(boardData.columns || []);
        setCards(boardData.cards || []);
        setHasMore((boardData.cards || []).length > 0);
      }
    } catch (error: any) {
      console.error('Error fetching board data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  useEffect(() => {
    if (board) {
      document.title = `${board.title} - Study Track`;
    }
    
    return () => {
      document.title = 'Study Track';
    };
  }, [board]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    
    // If there's no destination or source/destination are the same, do nothing
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;
    
    // If dragging columns
    if (type === 'column') {
      const newColumns = [...columns];
      const movedColumn = newColumns.find(col => col.id === draggableId);
      
      if (!movedColumn) return;
      
      // Remove the column from the array
      newColumns.splice(source.index, 1);
      // Add it at the new position
      newColumns.splice(destination.index, 0, movedColumn);
      
      // Update the order property for each column
      const updatedColumns = newColumns.map((col, index) => ({
        ...col,
        order: index
      }));
      
      setColumns(updatedColumns);
      
      // Update the database (only update the moved column)
      try {
        const { error } = await supabase
          .from('columns')
          .update({ order: destination.index })
          .eq('id', draggableId);
          
        if (error) throw error;
      } catch (error) {
        console.error('Error updating column order:', error);
        fetchBoardData(); // Refetch data to restore correct state
      }
      
      return;
    }
    
    // If dragging a card
    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);
    
    if (!sourceColumn || !destColumn) return;
    
    // If moving within the same column
    if (source.droppableId === destination.droppableId) {
      const columnCards = cards
        .filter(card => card.column_id === source.droppableId)
        .sort((a, b) => a.order - b.order);
      
      const movedCard = columnCards.find(card => card.id === draggableId);
      
      if (!movedCard) return;
      
      // Remove card from current position
      columnCards.splice(source.index, 1);
      // Insert at new position
      columnCards.splice(destination.index, 0, movedCard);
      
      // Update the order property
      const updatedCards = columnCards.map((card, index) => ({
        ...card,
        order: index
      }));
      
      // Update state
      setCards(cards.map(card => 
        updatedCards.find(u => u.id === card.id) || card
      ));
      
      // Update database
      try {
        const { error } = await supabase
          .from('cards')
          .update({ order: destination.index })
          .eq('id', draggableId);
          
        if (error) throw error;
      } catch (error) {
        console.error('Error updating card order:', error);
        fetchBoardData(); // Refetch data to restore correct state
      }
    } else {
      // Moving to a different column
      const sourceCards = cards
        .filter(card => card.column_id === source.droppableId)
        .sort((a, b) => a.order - b.order);
        
      const destCards = cards
        .filter(card => card.column_id === destination.droppableId)
        .sort((a, b) => a.order - b.order);
        
      const movedCard = sourceCards.find(card => card.id === draggableId);
      
      if (!movedCard) return;
      
      // Remove from source column
      sourceCards.splice(source.index, 1);
      // Add to destination column
      destCards.splice(destination.index, 0, {
        ...movedCard,
        column_id: destination.droppableId
      });
      
      // Update order in source column
      const updatedSourceCards = sourceCards.map((card, index) => ({
        ...card,
        order: index
      }));
      
      // Update order in destination column
      const updatedDestCards = destCards.map((card, index) => ({
        ...card,
        order: index
      }));
      
      // Combine updates
      const updatedCards = [
        ...cards.filter(card => 
          card.column_id !== source.droppableId && 
          card.column_id !== destination.droppableId
        ),
        ...updatedSourceCards,
        ...updatedDestCards
      ];
      
      // Update state
      setCards(updatedCards);
      
      // Update database
      try {
        const { error } = await supabase
          .from('cards')
          .update({ 
            column_id: destination.droppableId,
            order: destination.index 
          })
          .eq('id', draggableId);
          
        if (error) throw error;
      } catch (error) {
        console.error('Error updating card:', error);
        fetchBoardData(); // Refetch data to restore correct state
      }
    }
  };

  const addNewColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newColumnTitle.trim() || !board) return;
    
    try {
      const newOrder = columns.length;
      
      const { data, error } = await supabase
        .from('columns')
        .insert([
          {
            title: newColumnTitle.trim(),
            board_id: board.id,
            order: newOrder
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        setColumns([...columns, data]);
      }
      
      setNewColumnTitle('');
      setAddingColumn(false);
    } catch (error) {
      console.error('Error adding column:', error);
    }
  };

  const addNewCard = async (columnId: string) => {
    if (!board) return;
    
    const columnCards = cards.filter(card => card.column_id === columnId);
    const newOrder = columnCards.length;
    
    try {
      const { data, error } = await supabase
        .from('cards')
        .insert([
          {
            title: 'New Card',
            column_id: columnId,
            order: newOrder,
            content: {
              type: 'doc',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
            }
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        setCards([...cards, data]);
        setSelectedCard(data);
      }
    } catch (error) {
      console.error('Error adding card:', error);
    }
  };

  const updateBoardTitle = async () => {
    if (!board || !newBoardTitle.trim()) return;
    
    try {
      const { error } = await supabase
        .from('boards')
        .update({ title: newBoardTitle.trim() })
        .eq('id', board.id);
        
      if (error) throw error;
      
      setBoard({
        ...board,
        title: newBoardTitle.trim()
      });
      
      setEditingBoardTitle(false);
    } catch (error) {
      console.error('Error updating board title:', error);
    }
  };

  const updateBoardDescription = async () => {
    if (!board) return;
    
    try {
      const { error } = await supabase
        .from('boards')
        .update({ description: newBoardDescription.trim() })
        .eq('id', board.id);
        
      if (error) throw error;
      
      setBoard({
        ...board,
        description: newBoardDescription.trim()
      });
      
      setEditingBoardDescription(false);
    } catch (error) {
      console.error('Error updating board description:', error);
    }
  };

  const toggleBoardVisibility = async () => {
    if (!board) return;
    
    try {
      const newIsPublic = !board.is_public;
      
      const { error } = await supabase
        .from('boards')
        .update({ is_public: newIsPublic })
        .eq('id', board.id);
        
      if (error) throw error;
      
      setBoard({
        ...board,
        is_public: newIsPublic
      });
      
      setShowBoardMenu(false);
    } catch (error) {
      console.error('Error updating board visibility:', error);
    }
  };

  const deleteBoard = async () => {
    if (!board) return;
    
    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', board.id);
        
      if (error) throw error;
      
      navigate('/');
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  const deleteColumn = async (columnId: string) => {
    try {
      const { error } = await supabase
        .from('columns')
        .delete()
        .eq('id', columnId);
        
      if (error) throw error;
      
      setColumns(columns.filter(col => col.id !== columnId));
      setCards(cards.filter(card => card.column_id !== columnId));
    } catch (error) {
      console.error('Error deleting column:', error);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1);
      fetchBoardData();
    }
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
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

  if (!board) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quadro não encontrado</h2>
        <p className="text-gray-700 mb-6">O quadro que você está procurando não existe ou você não tem acesso a ele.</p>
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
    <div className="h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div className="flex items-start">
          {editingBoardTitle ? (
            <div className="flex items-center">
              <input
                type="text"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                className="text-2xl font-bold border-b-2 border-primary-500 bg-transparent focus:outline-none mr-2"
                onBlur={updateBoardTitle}
                onKeyDown={(e) => e.key === 'Enter' && updateBoardTitle()}
                autoFocus
              />
              <button 
                onClick={updateBoardTitle}
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
              onClick={() => setEditingBoardTitle(true)}
            >
              {board.title}
              <Edit2 className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h1>
          )}
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <div className="flex items-center mr-3">
            {board.is_public ? (
              <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                <Globe className="w-4 h-4 mr-1" />
                Público
              </div>
            ) : (
              <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                <Lock className="w-4 h-4 mr-1" />
                Privado
              </div>
            )}
          </div>
          
          <button className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowBoardMenu(!showBoardMenu)}
              className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            
            {showBoardMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={toggleBoardVisibility}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {board.is_public ? (
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
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir quadro
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingBoardDescription ? (
        <div className="mb-6">
          <textarea
            value={newBoardDescription}
            onChange={(e) => setNewBoardDescription(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
            placeholder="Add board description..."
            rows={2}
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setEditingBoardDescription(false)}
              className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={updateBoardDescription}
              className="px-3 py-1 text-sm text-white bg-primary-600 rounded hover:bg-primary-700"
            >
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="mb-6 group cursor-pointer" 
          onClick={() => setEditingBoardDescription(true)}
        >
          {board.description ? (
            <p className="text-gray-700">{board.description}</p>
          ) : (
            <p className="text-gray-500 italic flex items-center">
              Adicionar descrição do quadro...
              <Edit2 className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          )}
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="column">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex space-x-4 overflow-x-auto pb-4"
              style={{ minHeight: '70vh' }}
            >
              {columns
                .sort((a, b) => a.order - b.order)
                .map((column, index) => (
                  <Draggable key={column.id} draggableId={column.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="w-80 flex-shrink-0"
                      >
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
                          <div 
                            {...provided.dragHandleProps}
                            className="p-3 font-medium bg-gray-200 dark:bg-gray-700 rounded-t-lg flex justify-between items-center"
                          >
                            <h3 className="text-gray-900 dark:text-gray-100">{column.title}</h3>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => deleteColumn(column.id)}
                                className="p-1 text-gray-500 dark:text-gray-400 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <Droppable droppableId={column.id} type="card">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`p-2 min-h-[200px] ${
                                  snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : 'dark:bg-gray-800'
                                }`}
                              >
                                {cards
                                  .filter(card => card.column_id === column.id)
                                  .sort((a, b) => a.order - b.order)
                                  .map((card, index) => (
                                    <CardItem 
                                      key={card.id}
                                      card={card}
                                      index={index}
                                      onClick={() => setSelectedCard(card)}
                                    />
                                  ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                          
                          <div className="p-2">
                            <button
                              onClick={() => addNewCard(column.id)}
                              className="w-full p-2 text-left text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Adicionar cartão
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
              
              {provided.placeholder}
              
              {addingColumn ? (
                <div className="w-80 flex-shrink-0">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                    <form onSubmit={addNewColumn}>
                      <input
                        type="text"
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        className="w-full p-2 mb-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                        placeholder="Digite o título da coluna..."
                        autoFocus
                      />
                      <div className="flex justify-between">
                        <button
                          type="button"
                          onClick={() => setAddingColumn(false)}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
                        >
                          Adicionar Coluna
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="w-80 flex-shrink-0">
                  <button
                    onClick={() => setAddingColumn(true)}
                    className="h-full min-h-[100px] w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center text-gray-700 dark:text-gray-300"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Adicionar nova coluna
                  </button>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Card Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          column={columns.find(col => col.id === selectedCard.column_id)}
          onClose={() => setSelectedCard(null)}
          onCardUpdate={(updatedCard) => {
            setCards(cards.map(c => c.id === updatedCard.id ? updatedCard : c));
            setSelectedCard(updatedCard);
          }}
          onCardDelete={(cardId) => {
            setCards(cards.filter(c => c.id !== cardId));
            setSelectedCard(null);
          }}
        />
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Excluir Quadro</h2>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir "{board.title}"? Esta ação não pode ser desfeita.
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
                onClick={deleteBoard}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Board;