import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Calendar, Tag, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import RichTextEditor from '../editor/RichTextEditor';
import type { Database } from '../../lib/database.types';

type Card = Database['public']['Tables']['cards']['Row'];
type Column = Database['public']['Tables']['columns']['Row'];

interface CardModalProps {
  card: Card;
  column: Column | undefined;
  onClose: () => void;
  onCardUpdate: (card: Card) => void;
  onCardDelete: (cardId: string) => void;
}

const CardModal = ({ card, column, onClose, onCardUpdate, onCardDelete }: CardModalProps) => {
  const [title, setTitle] = useState(card.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [content, setContent] = useState(card.content);
  const [dueDate, setDueDate] = useState<string | null>(card.due_date);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tags, setTags] = useState<string[]>(card.tags || []);
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateCardTitle = async () => {
    if (!title.trim()) return;
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('cards')
        .update({ title: title.trim() })
        .eq('id', card.id)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        onCardUpdate(data);
      }
      
      setEditingTitle(false);
    } catch (error) {
      console.error('Error updating card title:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateCardContent = async (newContent: any) => {
    setContent(newContent);
    
    try {
      const { data, error } = await supabase
        .from('cards')
        .update({ content: newContent })
        .eq('id', card.id)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        onCardUpdate(data);
      }
    } catch (error) {
      console.error('Error updating card content:', error);
    }
  };

  const updateDueDate = async (date: string | null) => {
    setDueDate(date);
    setShowDatePicker(false);
    
    try {
      const { data, error } = await supabase
        .from('cards')
        .update({ due_date: date })
        .eq('id', card.id)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        onCardUpdate(data);
      }
    } catch (error) {
      console.error('Error updating due date:', error);
    }
  };

  const addTag = async () => {
    if (!newTag.trim()) return;
    
    const updatedTags = [...tags, newTag.trim()];
    setTags(updatedTags);
    setNewTag('');
    setAddingTag(false);
    
    try {
      const { data, error } = await supabase
        .from('cards')
        .update({ tags: updatedTags })
        .eq('id', card.id)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        onCardUpdate(data);
      }
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const removeTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    
    try {
      const { data, error } = await supabase
        .from('cards')
        .update({ tags: updatedTags })
        .eq('id', card.id)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        onCardUpdate(data);
      }
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const deleteCard = async () => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', card.id);
        
      if (error) throw error;
      
      onCardDelete(card.id);
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start p-4 border-b">
          <div className="flex-1 mr-4">
            {editingTitle ? (
              <div className="flex items-center">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xl font-bold border-b-2 border-primary-500 focus:outline-none py-1"
                  onBlur={updateCardTitle}
                  onKeyDown={(e) => e.key === 'Enter' && updateCardTitle()}
                  autoFocus
                />
                <button
                  onClick={updateCardTitle}
                  disabled={isSaving}
                  className="ml-2 p-1 text-primary-600 hover:text-primary-800 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-t-2 border-primary-600 rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              <h2 
                className="text-xl font-bold text-gray-900 cursor-pointer hover:text-primary-600 group flex items-center" 
                onClick={() => setEditingTitle(true)}
              >
                {title}
                <Edit2 className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>
            )}
            {column && (
              <p className="text-sm text-gray-500 mt-1">
                In column: {column.title}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="mb-6">
              <h3 className="text-base font-medium text-gray-900 mb-2">Description</h3>
              <RichTextEditor 
                initialContent={content} 
                onChange={updateCardContent} 
                placeholder="Add a description..." 
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Add to card</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center w-full p-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                  {dueDate ? 'Change due date' : 'Add due date'}
                </button>
                
                {showDatePicker && (
                  <div className="bg-white rounded border shadow-sm p-3">
                    <input
                      type="date"
                      value={dueDate ? dueDate.split('T')[0] : ''}
                      onChange={(e) => updateDueDate(e.target.value ? `${e.target.value}T00:00:00Z` : null)}
                      className="w-full p-2 border rounded"
                    />
                    {dueDate && (
                      <button
                        onClick={() => updateDueDate(null)}
                        className="mt-2 w-full p-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Remove due date
                      </button>
                    )}
                  </div>
                )}
                
                <button
                  onClick={() => setAddingTag(!addingTag)}
                  className="flex items-center w-full p-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  <Tag className="w-5 h-5 mr-2 text-gray-600" />
                  Add tag
                </button>
                
                {addingTag && (
                  <div className="bg-white rounded border shadow-sm p-3">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      className="w-full p-2 border rounded mb-2"
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={addTag}
                        disabled={!newTag.trim()}
                        className="px-3 py-1 bg-primary-600 text-white rounded disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={deleteCard}
                  className="flex items-center w-full p-2 text-red-600 bg-gray-100 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete card
                </button>
              </div>
            </div>
            
            {/* Due Date Display */}
            {dueDate && (
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-2">Due Date</h3>
                <div className="flex items-center p-2 bg-blue-50 text-blue-700 rounded">
                  <Calendar className="w-5 h-5 mr-2" />
                  {format(new Date(dueDate), 'MMM d, yyyy')}
                </div>
              </div>
            )}
            
            {/* Tags Display */}
            {tags.length > 0 && (
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <div 
                      key={index} 
                      className="flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {tag}
                      <button 
                        onClick={() => removeTag(tag)}
                        className="ml-1 p-1 text-purple-800 hover:text-purple-900 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;