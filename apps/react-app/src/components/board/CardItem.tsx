import { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Calendar, Tag, CheckSquare } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Card = Database['public']['Tables']['cards']['Row'];

interface CardItemProps {
  card: Card;
  index: number;
  onClick: () => void;
}

const CardItem = ({ card, index, onClick }: CardItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Check if card has a due date
  const hasDueDate = !!card.due_date;
  
  // Check if card has tags
  const hasTags = card.tags && card.tags.length > 0;
  
  // Check if card has a checklist
  const hasChecklist = card.content && typeof card.content === 'object' && 
    'content' in card.content && Array.isArray(card.content.content) &&
    card.content.content.some(
      (item: any) => item.type === 'taskList' || 
      (item.content && item.content.some((subItem: any) => subItem.type === 'taskItem'))
    );

  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow ${
            snapshot.isDragging ? 'shadow-md opacity-90' : ''
          }`}
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="p-3">
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">{card.title}</h3>
            
            {/* Indicators */}
            {(hasDueDate || hasTags || hasChecklist) && (
              <div className="flex items-center mt-2 space-x-2">
                {hasDueDate && (
                  <div className="flex items-center px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(card.due_date!).toLocaleDateString()}
                  </div>
                )}
                
                {hasTags && (
                  <div className="flex items-center px-2 py-0.5 text-xs rounded bg-purple-50 text-purple-700">
                    <Tag className="w-3 h-3 mr-1" />
                    {(card.tags as string[]).length}
                  </div>
                )}
                
                {hasChecklist && (
                  <div className="flex items-center px-2 py-0.5 text-xs rounded bg-green-50 text-green-700">
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Checklist
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default CardItem;