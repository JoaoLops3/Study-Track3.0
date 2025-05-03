import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment-timezone';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getGoogleCalendarEvents, getGoogleCalendarTasks, createGoogleCalendarEvent, GoogleTask } from '../lib/googleCalendar';
import { supabase } from '../lib/supabase';
import { X, Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

// Estilos para diferenciar tarefas e eventos
const styles = `
  .task-event {
    background-color: #4CAF50 !important;
    border-left: 4px solid #388E3C !important;
  }
  
  .calendar-event {
    background-color: #2196F3 !important;
    border-left: 4px solid #1976D2 !important;
  }
  
  .task-event:hover {
    background-color: #388E3C !important;
  }
  
  .calendar-event:hover {
    background-color: #1976D2 !important;
  }
`;

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
}

interface Event {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  google_event_id?: string;
  allDay: boolean;
  isTask?: boolean;
  taskListTitle?: string;
}

let renderCount = 0;
export function Calendar() {
  renderCount++;
  console.log('==== Calendar.tsx MONTADO ====', renderCount);
  console.log('ANTES do useEffect');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start: '',
    end: ''
  });

  async function loadEvents() {
    console.log('Entrou em loadEvents');
    try {
      console.log('Iniciando loadEvents...');
      setLoading(true);
      setError(null);
      
      // Buscar eventos e tarefas do Google Calendar
      const [googleEvents, googleTasks] = await Promise.all([
        getGoogleCalendarEvents(),
        getGoogleCalendarTasks()
      ]);
      
      console.log('googleEvents recebidos:', googleEvents);
      console.log('googleTasks recebidas:', googleTasks);

      // Converter eventos para o formato do react-big-calendar
      const formattedEvents = googleEvents.map((event: GoogleEvent, idx: number) => {
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
            const endStr = `${event.end.date}T23:59:59-03:00`;
            startDate = new Date(startStr);
            endDate = new Date(endStr);
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
            google_event_id: String(event.id),
            isTask: false
          };
          console.log(`Evento[${idx}] mapeado:`, mapped);
          console.log(`  start: ${startDate.toISOString()}, end: ${endDate.toISOString()}`);
          return mapped;
        } catch (error) {
          console.error(`Erro ao mapear evento[${idx}]:`, error, event);
          return null;
        }
      }).filter((event): event is Event => event !== null);

      // Converter tarefas para o formato do react-big-calendar
      const formattedTasks = googleTasks.map((task: GoogleTask, idx: number) => {
        try {
          console.log(`Processando tarefa[${idx}]:`, task);
          
          const startDate = task.due ? new Date(task.due) : new Date();
          const endDate = new Date(startDate);
          endDate.setHours(23, 59, 59);

          const mapped: Event = {
            id: String(task.id),
            title: String(task.title || ''),
            description: task.notes || '',
            start: startDate,
            end: endDate,
            allDay: true,
            isTask: true,
            taskListTitle: task.taskListTitle
          };
          
          console.log(`Tarefa[${idx}] mapeada:`, mapped);
          return mapped;
        } catch (error) {
          console.error(`Erro ao mapear tarefa[${idx}]:`, error, task);
          return null;
        }
      }).filter((task: Event | null): task is Event => task !== null);

      // Combinar eventos e tarefas
      const allItems = [...formattedEvents, ...formattedTasks];
      
      // Log do array formatado antes do setEvents
      console.log('formattedEvents:', formattedEvents);
      console.log('formattedTasks:', formattedTasks);
      console.log('allItems:', allItems);
      
      setEvents(allItems);
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log('useEffect - Carregando eventos...');
    loadEvents();
  }, []);
  console.log('DEPOIS do useEffect');

  async function handleSync() {
    try {
      setSyncing(true);
      setError(null);
      await loadEvents();
      toast.success('Eventos sincronizados com sucesso!');
    } catch (err) {
      console.error('Erro na sincronização:', err);
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar eventos');
      toast.error('Erro ao sincronizar eventos');
    } finally {
      setSyncing(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

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

      // Cria o evento no banco local
      const event = {
        title: newEvent.title,
        description: newEvent.description,
        start: new Date(newEvent.start),
        end: new Date(newEvent.end),
        user_id: session.user.id
      };

      const { data, error } = await supabase
        .from('events')
        .insert([event])
        .select()
        .single();

      if (error) throw error;

      setEvents([...events, data]);
      setIsModalOpen(false);
      setNewEvent({
        title: '',
        description: '',
        start: '',
        end: ''
      });

      toast.success('Evento criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast.error('Erro ao criar evento');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>;
  }

  // Log detalhado dos eventos enviados para o BigCalendar
  if (!events || events.length === 0) {
    console.warn('Nenhum evento enviado para o BigCalendar!');
  } else {
    console.log("Eventos enviados para o BigCalendar:", events);
    events.forEach((ev, idx) => {
      console.log(`Evento[${idx}]:`, ev);
      console.log(`  id: ${typeof ev.id}, title: ${typeof ev.title}, start: ${ev.start instanceof Date}, end: ${ev.end instanceof Date}, allDay: ${typeof ev.allDay}`);
      console.log(`  start: ${ev.start.toISOString()}, end: ${ev.end.toISOString()}`);
    });
  }

  // Log adicional antes do render
  console.log("Renderizando Calendar, eventos:", events);

  // Fallback visual se não houver eventos
  if (!events || events.length === 0) {
    return <div className="flex items-center justify-center h-64 text-red-500 font-bold">Nenhum evento do Google Calendar encontrado!</div>;
  }

  // Exibir apenas os eventos do Google no calendário
  return (
    <div className="h-[600px] p-4">
      <style>{styles}</style>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Calendário</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Evento</span>
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        defaultView="month"
        views={['month', 'week', 'day']}
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
        onNavigate={(date) => {
          console.log('Navegando para:', date);
        }}
        onView={(view) => {
          console.log('Mudando para view:', view);
        }}
        onRangeChange={(range) => {
          console.log('Range mudou:', range);
        }}
        onSelectEvent={(event) => {
          console.log('Evento selecionado:', event);
        }}
        onSelectSlot={(slotInfo) => {
          console.log('Slot selecionado:', slotInfo);
        }}
        defaultDate={new Date()}
        min={new Date('2025-05-01')}
        max={new Date('2025-05-31')}
        step={60}
        timeslots={1}
        showMultiDayTimes={true}
        dayLayoutAlgorithm="no-overlap"
        popup
        selectable
        eventPropGetter={(event) => ({
          className: event.isTask ? 'task-event' : 'calendar-event',
          style: {
            backgroundColor: event.isTask ? '#4CAF50' : '#2196F3',
            borderRadius: '4px',
            opacity: 0.8,
            color: 'white',
            border: '0px',
            display: 'block'
          }
        })}
      />

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

            <form onSubmit={handleSubmit} className="space-y-6">
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
} 