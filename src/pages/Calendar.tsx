import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';
import { Calendar as CalendarIcon, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import { EventModal } from '../components/calendar/EventModal';
import { supabase } from '../lib/supabase';
import { getGoogleCalendarEvents, createGoogleCalendarEvent } from '../lib/googleCalendar';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
});

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  google_event_id?: string;
}

const CalendarPage = () => {
  const { theme } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;

      const formattedEvents = data.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_date),
        end: new Date(event.end_date),
        description: event.description,
        google_event_id: event.google_event_id,
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast.error('Erro ao carregar eventos');
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await getGoogleCalendarEvents();
      await fetchEvents();
      toast.success('Sincronização concluída com sucesso');
    } catch (error) {
      console.error('Erro na sincronização:', error);
      if (error instanceof Error && error.message.includes('Token de acesso não encontrado')) {
        toast.error('Por favor, reconecte sua conta do Google nas configurações');
      } else {
        toast.error('Erro ao sincronizar com Google Calendar');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddEvent = async (event: {
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('events')
        .insert({
          user_id: session.user.id,
          title: event.title,
          description: event.description,
          start_date: event.startDate,
          end_date: event.endDate,
        })
        .select()
        .single();

      if (error) throw error;

      const newEvent = {
        id: data.id,
        title: data.title,
        start: new Date(data.start_date),
        end: new Date(data.end_date),
        description: data.description,
      };

      setEvents(prev => [...prev, newEvent]);
      setIsModalOpen(false);
      toast.success('Evento criado com sucesso');

      // Sincronizar com Google Calendar
      await handleSync();
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast.error('Erro ao criar evento');
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      setEvents(prev => prev.filter(e => e.id !== event.id));
      toast.success('Evento excluído com sucesso');

      // Sincronizar com Google Calendar
      await handleSync();
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast.error('Erro ao excluir evento');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendário</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar Evento
          </button>
        </div>
      </div>

      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${theme === 'dark' ? 'dark' : ''}`}>
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          views={['month', 'week', 'day', 'agenda']}
          onSelectEvent={event => {
            if (window.confirm('Deseja excluir este evento?')) {
              handleDeleteEvent(event);
            }
          }}
        />
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddEvent}
      />
    </div>
  );
};

export default CalendarPage;