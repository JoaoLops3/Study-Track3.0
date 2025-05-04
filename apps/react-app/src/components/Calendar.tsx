import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment-timezone';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getGoogleCalendarEvents, getGoogleCalendarTasks, createGoogleCalendarEvent } from '../lib/googleCalendar/events';
import { GoogleTask } from '../lib/googleCalendar/types';
import { supabase } from '../lib/supabase';
import { X, Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { checkGoogleConnection } from '../lib/googleCalendar/auth';

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

// Hook para verificar status do Google Calendar
function useGoogleCalendarStatus() {
  const [status, setStatus] = useState<{ loading: boolean, connected: boolean, error?: string }>({ loading: true, connected: false });

  useEffect(() => {
    async function check() {
      const result = await checkGoogleConnection();
      setStatus({ loading: false, connected: result.isConnected, error: result.error });
    }
    check();
  }, []);

  return status;
}

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

  const googleStatus = useGoogleCalendarStatus();

  // Exemplo de uso do status
  useEffect(() => {
    if (!googleStatus.loading) {
      if (googleStatus.connected) {
        console.log('Google Calendar está conectado!');
      } else {
        console.log('Google Calendar NÃO está conectado:', googleStatus.error);
      }
    }
  }, [googleStatus]);

  async function loadEvents() {
    console.log('Entrou em loadEvents');
    try {
      console.log('Iniciando loadEvents...');
      setLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.provider_token) {
        setError('Você precisa conectar sua conta do Google para ver os eventos.');
        toast.error('Conecte sua conta do Google para ver os eventos');
        return;
      }

      // Verificar conexão com Google
      const connectionStatus = await checkGoogleConnection();
      if (!connectionStatus.isConnected) {
        if (connectionStatus.error?.includes('Redirecionando')) {
          return; // Não mostrar erro se estiver redirecionando
        }
        setError(connectionStatus.error || 'Erro ao conectar com o Google Calendar');
        toast.error('Erro ao conectar com o Google Calendar');
        return;
      }

      if (!connectionStatus.calendars || connectionStatus.calendars.length === 0) {
        setError('Nenhum calendário encontrado. Verifique se você tem calendários no Google Calendar.');
        toast.error('Nenhum calendário encontrado');
        return;
      }

      // Buscar eventos e tarefas do Google Calendar
      const [googleEvents, googleTasks] = await Promise.all([
        getGoogleCalendarEvents({
          timeMin: new Date().toISOString(),
          timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
          maxResults: 100,
          singleEvents: true,
          orderBy: 'startTime'
        }),
        getGoogleCalendarTasks()
      ]);
      
      console.log('googleEvents recebidos:', googleEvents);
      console.log('googleTasks recebidas:', googleTasks);

      if (!googleEvents || googleEvents.length === 0) {
        console.log('Nenhum evento encontrado');
        setEvents([]);
        return;
      }

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
            title: String(event.summary || 'Sem título'),
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
      const formattedTasks = googleTasks?.map((task: GoogleTask, idx: number) => {
        try {
          console.log(`Processando tarefa[${idx}]:`, task);
          
          const startDate = task.due ? new Date(task.due) : new Date();
          const endDate = new Date(startDate);
          endDate.setHours(23, 59, 59);

          const mapped: Event = {
            id: String(task.id),
            title: String(task.title || 'Sem título'),
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
      }).filter((task: Event | null): task is Event => task !== null) || [];

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
      toast.error('Erro ao carregar eventos. Tente novamente.');
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Carregando eventos...</span>
      </div>
    );
  }

  if (error) {
    const deveMostrarBotaoConectar = error.toLowerCase().includes('conectar') || error.toLowerCase().includes('nenhum evento do google calendar encontrado');
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 mb-4">
          <X className="w-12 h-12" />
        </div>
        <p className="text-red-600 font-medium mb-4 text-center max-w-md">{error}</p>
        <div className="flex space-x-4">
          {deveMostrarBotaoConectar ? (
            <button
              onClick={() => checkGoogleConnection()}
              className="flex items-center justify-center px-6 py-3 bg-white border border-gray-300 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ minWidth: 220 }}
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
                <g>
                  <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.64 2.36 30.18 0 24 0 14.82 0 6.71 5.48 2.69 13.44l7.98 6.2C12.33 13.13 17.68 9.5 24 9.5z"/>
                  <path fill="#34A853" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v9.04h12.42c-.54 2.9-2.18 5.36-4.64 7.04l7.18 5.59C43.98 37.13 46.1 31.3 46.1 24.5z"/>
                  <path fill="#FBBC05" d="M10.67 28.04A14.5 14.5 0 019.5 24c0-1.4.23-2.76.64-4.04l-7.98-6.2A23.93 23.93 0 000 24c0 3.77.9 7.34 2.49 10.5l8.18-6.46z"/>
                  <path fill="#EA4335" d="M24 48c6.18 0 11.36-2.05 15.14-5.59l-7.18-5.59c-2.01 1.35-4.59 2.16-7.96 2.16-6.32 0-11.67-3.63-13.33-8.7l-8.18 6.46C6.71 42.52 14.82 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </g>
              </svg>
              <span className="text-gray-800 font-semibold text-base">Conectar com Google</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleSync}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Evento</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Log detalhado dos eventos enviados para o BigCalendar
  console.log("Eventos enviados para o BigCalendar:", events);
  events.forEach((ev, idx) => {
    console.log(`Evento[${idx}]:`, ev);
    console.log(`  id: ${typeof ev.id}, title: ${typeof ev.title}, start: ${ev.start instanceof Date}, end: ${ev.end instanceof Date}, allDay: ${typeof ev.allDay}`);
    console.log(`  start: ${ev.start.toISOString()}, end: ${ev.end.toISOString()}`);
  });

  // Log adicional antes do render
  console.log("Renderizando Calendar, eventos:", events);

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

      {events.length > 0 ? (
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
          min={new Date(new Date().getFullYear(), 0, 1)}
          max={new Date(new Date().getFullYear(), 11, 31)}
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
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-gray-400 mb-4">
            <CalendarIcon className="w-12 h-12" />
          </div>
          <p className="text-gray-600 font-medium mb-4">Nenhum evento encontrado</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Evento</span>
          </button>
        </div>
      )}

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