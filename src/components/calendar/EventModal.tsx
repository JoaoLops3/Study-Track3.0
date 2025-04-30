import { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: {
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  }) => void;
}

export function EventModal({ isOpen, onClose, onSubmit }: EventModalProps) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      startDate,
      endDate,
      description,
    });
    // Limpar campos após envio
    setTitle('');
    setStartDate('');
    setEndDate('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-md w-full p-8 transform transition-all duration-300 ease-in-out hover:shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
            Adicionar Novo Evento
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors group-hover:text-primary-500">
              Título
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       dark:bg-gray-700 dark:text-white transition-all duration-200
                       placeholder-gray-400 hover:border-primary-400"
                placeholder="Digite o título do evento"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors group-hover:text-primary-500">
                Data de Início
              </label>
              <div className="relative">
                <input 
                  type="datetime-local" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white transition-all duration-200
                         hover:border-primary-400"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Calendar className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                </div>
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors group-hover:text-primary-500">
                Data de Término
              </label>
              <div className="relative">
                <input 
                  type="datetime-local" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white transition-all duration-200
                         hover:border-primary-400"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Clock className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                </div>
              </div>
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors group-hover:text-primary-500">
              Descrição
            </label>
            <div className="relative">
              <textarea 
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setDescription(e.target.value);
                  }
                }}
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       dark:bg-gray-700 dark:text-white transition-all duration-200
                       placeholder-gray-400 hover:border-primary-400 resize-none"
                rows={4}
                placeholder="Digite a descrição do evento"
              />
              <div className="absolute bottom-3 right-3">
                <span className="text-xs text-gray-400">{description.length}/500</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 
                     hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white
                     bg-gradient-to-r from-primary-500 to-primary-600
                     hover:from-primary-600 hover:to-primary-700
                     transform transition-all duration-200 hover:scale-105
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                     shadow-lg hover:shadow-xl"
            >
              Adicionar Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 