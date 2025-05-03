import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment-timezone';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';
import { Calendar as CalendarIcon, Plus, RefreshCw, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { getGoogleCalendarEvents, createGoogleCalendarEvent } from '../lib/googleCalendar';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

interface Event {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  google_event_id?: string;
  allDay?: boolean;
}

let renderCount = 0;

const CalendarPage = () => {
  renderCount++;
  console.log('==== CalendarPage MONTADO ====', renderCount);
  console.log('ANTES do useEffect');

  const { theme } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start: '',
    end: ''
  });

  useEffect(() => {
    console.log('useEffect - Carregando eventos...');
    loadEvents();
  }, []);
  console.log('DEPOIS do useEffect');

  async function loadEvents() {
    console.log('Entrou em loadEvents');
    setLoading(true);
    try {
      // Buscar eventos do Google Calendar
      const googleEvents = await getGoogleCalendarEvents();
      console.log('googleEvents recebidos:', googleEvents);

      // Converter eventos para o formato do react-big-calendar
      const formattedEvents = googleEvents.map((event, idx) => {
        let startDate: Date;
        let endDate: Date;
        let allDay = false;
        try {
          console.log(`Processando evento[${idx}]:`, event);
          if (event.start.dateTime) {
            startDate = new Date(event.start.dateTime);
            endDate = new Date(event.end.dateTime);
            allDay = false;
          } else if (event.start.date) {
            // Ajuste para timezone do Brasil
            const startStr = `${event.start.date}T00:00:00-03:00`;
            const endStr = `${event.end.date}T00:00:00-03:00`;
            startDate = new Date(startStr);
            endDate = new Date(new Date(endStr).getTime() - 1);
            allDay = true;
          } else {
            console.warn(`Evento[${idx}] ignorado: início inválido`, event);
            return null;
          }
          const mapped = {
            id: String(event.id),
            title: String(event.summary || ''),
            description: event.description || '',
            start: startDate,
            end: endDate,
            allDay,
            google_event_id: String(event.id)
          };
          console.log(`Evento[${idx}] mapeado:`, mapped);
          console.log(`  start: ${startDate.toISOString()}, end: ${endDate.toISOString()}`);
          return mapped;
        } catch (error) {
          console.error(`Erro ao mapear evento[${idx}]:`, error, event);
          return null;
        }
      }).filter((event): event is Event => event !== null);

      console.log('formattedEvents:', formattedEvents);
      (window as any).events = formattedEvents;
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
      toast.error('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    try {
      setIsSyncing(true);
      await loadEvents();
      toast.success('Eventos sincronizados com sucesso!');
    } catch (err) {
      console.error('Erro na sincronização:', err);
      toast.error('Erro ao sincronizar eventos');
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    try {
      // Cria o evento no Google Calendar
      await createGoogleCalendarEvent({
        summary: newEvent.title,
        description: newEvent.description,
        start: {
          dateTime: new Date(newEvent.start).toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: new Date(newEvent.end).toISOString(),
          timeZone: 'America/Sao_Paulo'
        }
      });
      setIsModalOpen(false);
      setNewEvent({ title: '', description: '', start: '', end: '' });
      toast.success('Evento criado com sucesso!');
      await loadEvents();
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast.error('Erro ao criar evento');
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!events || events.length === 0) {
    console.warn('Nenhum evento enviado para o BigCalendar!');
    return <div className="flex items-center justify-center h-64 text-red-500 font-bold">Nenhum evento do Google Calendar encontrado!</div>;
  } else {
    console.log("Eventos enviados para o BigCalendar:", events);
    events.forEach((ev, idx) => {
      console.log(`Evento[${idx}]:`, ev);
      console.log(`  id: ${typeof ev.id}, title: ${typeof ev.title}, start: ${ev.start instanceof Date}, end: ${ev.end instanceof Date}, allDay: ${typeof ev.allDay}`);
      console.log(`  start: ${ev.start.toISOString()}, end: ${ev.end.toISOString()}`);
    });
  }

  console.log("Renderizando CalendarPage, eventos:", events);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendário</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar Evento
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
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
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            date: "Data",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "Não há eventos neste período"
          }}
          onSelectEvent={event => {
            console.log('Evento selecionado:', event);
          }}
          onSelectSlot={slotInfo => {
            console.log('Slot selecionado:', slotInfo);
          }}
          selectable
          defaultDate={new Date()}
          min={new Date(new Date().getFullYear(), 0, 1)}
          max={new Date(new Date().getFullYear(), 11, 31)}
        />
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-md w-full p-8 transform transition-all duration-300 ease-in-out hover:shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
                Adicionar Novo Evento
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="space-y-6">
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors group-hover:text-primary-500">
                  Título
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
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
                      value={newEvent.start}
                      onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                               focus:ring-2 focus:ring-primary-500 focus:border-transparent
                               dark:bg-gray-700 dark:text-white transition-all duration-200
                               hover:border-primary-400"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
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
                      value={newEvent.end}
                      onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
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
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                             focus:ring-2 focus:ring-primary-500 focus:border-transparent
                             dark:bg-gray-700 dark:text-white transition-all duration-200
                             placeholder-gray-400 hover:border-primary-400 resize-none"
                    rows={4}
                    placeholder="Digite a descrição do evento"
                    maxLength={500}
                  />
                  <div className="absolute bottom-3 right-3">
                    <span className="text-xs text-gray-400">
                      {newEvent.description.length}/500
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
      )}
    </div>
  );
};

export default CalendarPage;