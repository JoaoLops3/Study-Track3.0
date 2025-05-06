import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment-timezone';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';
import { Calendar as CalendarIcon, Plus, RefreshCw, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { getGoogleCalendarEvents, createGoogleCalendarEvent } from '../lib/googleCalendar/events';
import { getGoogleAccessToken } from '../lib/googleCalendar/auth';
import { GoogleConnectButton } from '../components/integrations/GoogleConnectButton';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { GoogleCalendarEvent } from '../lib/googleCalendar/types';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  description?: string;
}

const viewMessages = {
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda'
} as const;

const CalendarPage = () => {
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
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const { settings, updateSettings } = useSettings();
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('month');
  const { user } = useAuth();
  const toast = useToast();

  // Carregar eventos iniciais
  useEffect(() => {
    const loadInitialEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verificar sessão
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Por favor, faça login para acessar o calendário');
          setLoading(false);
          return;
        }

        // Obter token do Google
        const token = await getGoogleAccessToken();
        if (!token) {
          setError('Por favor, conecte sua conta do Google para visualizar os eventos');
          setGoogleToken(null);
          setLoading(false);
          return;
        }

        setGoogleToken(token);

        // Configurar datas para busca de todo o ano de 2025
        const startDate = new Date('2025-01-01T00:00:00-03:00');
        const endDate = new Date('2025-12-31T23:59:59-03:00');

        // Buscar eventos
        const googleEvents = await getGoogleCalendarEvents(
          startDate.toISOString(),
          endDate.toISOString()
        );

        console.log('Eventos recebidos da API:', googleEvents.length, googleEvents);

        if (googleEvents && googleEvents.length > 0) {
          const formattedEvents = googleEvents.map(event => {
            const start = new Date(event.start.dateTime);
            const end = new Date(event.end.dateTime);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
              console.warn('Evento descartado por data inválida:', event);
              return null;
            }

            // Ajustar a data de fim para eventos de um dia
            if (event.allDay) {
              end.setHours(23, 59, 59, 999);
            }

            return {
              id: event.id,
              title: event.summary,
              description: event.description,
              start,
              end,
              allDay: event.allDay
            };
          }).filter(Boolean);

          console.log('Eventos formatados para o calendário:', formattedEvents.length, formattedEvents);

          // Ordenar eventos por data
          formattedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

          setEvents(formattedEvents);
          toast.success(`${formattedEvents.length} eventos carregados`);
        } else {
          setEvents([]);
          toast.info('Nenhum evento encontrado');
        }
      } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        setError('Erro ao carregar eventos do Google Calendar');
        toast.error('Erro ao carregar eventos');
      } finally {
        setLoading(false);
      }
    };

    loadInitialEvents();
  }, []);

  // Função para sincronizar eventos
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);

      const token = await getGoogleAccessToken();
      if (!token) {
        setError('Por favor, conecte sua conta do Google para visualizar os eventos');
        setGoogleToken(null);
        return;
      }

      setGoogleToken(token);

      // Configurar datas para busca de todos os eventos
      const startDate = new Date('2000-01-01T00:00:00-03:00'); // Data inicial distante
      const endDate = new Date('2100-12-31T23:59:59-03:00'); // Data final distante

      const googleEvents = await getGoogleCalendarEvents(
        startDate.toISOString(),
        endDate.toISOString()
      );

      if (googleEvents && googleEvents.length > 0) {
        const formattedEvents = googleEvents.map(event => {
          const start = new Date(event.start.dateTime);
          const end = new Date(event.end.dateTime);
          
          // Ajustar a data de fim para eventos de um dia
          if (event.allDay) {
            end.setHours(23, 59, 59, 999);
          }
          
          console.log('Formatando evento:', {
            id: event.id,
            title: event.summary,
            start: start.toISOString(),
            end: end.toISOString(),
            allDay: event.allDay
          });
          
          return {
            id: event.id,
            title: event.summary,
            description: event.description,
            start,
            end,
            allDay: event.allDay
          };
        });
        
        setEvents(formattedEvents);
        toast.success(`${formattedEvents.length} eventos sincronizados`);
      } else {
        setEvents([]);
        toast.info('Nenhum evento encontrado');
      }
    } catch (error) {
      console.error('Erro ao sincronizar eventos:', error);
      setError('Erro ao sincronizar eventos do Google Calendar');
      toast.error('Erro ao sincronizar eventos');
    } finally {
      setIsSyncing(false);
    }
  };

  // Função para adicionar evento
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!googleToken) {
        toast.error('Por favor, conecte sua conta Google primeiro');
        return;
      }

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
      handleSync();
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast.error('Erro ao criar evento');
    }
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const eventStyleGetter = (event: Event) => {
    return {
      style: {
        backgroundColor: '#3B82F6',
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendário</h1>
        <div className="flex space-x-4">
          <GoogleConnectButton variant="primary" />
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar Evento
          </button>
          {googleToken && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {!googleToken && (
        <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          Conecte sua conta Google para ver seus eventos do Google Calendar
        </div>
      )}

      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${theme === 'dark' ? 'dark' : ''}`}>
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          view={view}
          onView={handleViewChange}
          eventPropGetter={eventStyleGetter}
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: viewMessages.month,
            week: viewMessages.week,
            day: viewMessages.day,
            agenda: viewMessages.agenda,
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
            setIsModalOpen(true);
            setNewEvent({
              title: '',
              description: '',
              start: slotInfo.start.toISOString().slice(0, 16),
              end: slotInfo.end.toISOString().slice(0, 16)
            });
          }}
          selectable
          defaultDate={new Date()}
          min={new Date(new Date().getFullYear(), 0, 1)}
          max={new Date(new Date().getFullYear(), 11, 31)}
          components={{
            toolbar: (props) => {
              const views = ['month', 'week', 'day', 'agenda'];
              const viewLabels = {
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
                agenda: 'Agenda'
              };

              return (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => props.onNavigate('PREV')}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => props.onNavigate('TODAY')}
                      className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors duration-200"
                    >
                      Hoje
                    </button>
                    <button
                      onClick={() => props.onNavigate('NEXT')}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {props.label || 'Calendário'}
                    </h2>
                  </div>
                  <div className="flex space-x-2">
                    {views.map((view) => (
                      <button
                        key={view}
                        onClick={() => props.onView(view)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          props.view === view
                            ? 'bg-primary-500 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {viewLabels[view]}
                      </button>
                    ))}
                  </div>
                </div>
              );
            },
            event: ({ event }) => (
              <div className="p-1">
                <div className="font-medium truncate">{event.title}</div>
                {event.description && (
                  <div className="text-sm opacity-75 truncate">{event.description}</div>
                )}
              </div>
            ),
            month: {
              dateHeader: ({ date, label }) => (
                <div className="p-2 text-center">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{label}</div>
                </div>
              ),
              header: ({ date, localizer }) => (
                <div className="p-2 text-center bg-gray-50 dark:bg-gray-700">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {localizer.format(date, 'weekdayFormat')}
                  </div>
                </div>
              )
            }
          }}
          className="rbc-calendar"
        />
      </div>

      {events.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between">
          <span>{events.length} eventos carregados</span>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-primary-500"></div>
            <span>Eventos</span>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-md w-full p-8">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           dark:bg-gray-700 dark:text-white"
                  placeholder="Digite o título do evento"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Início
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.start}
                    onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                             focus:ring-2 focus:ring-primary-500 focus:border-transparent
                             dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Término
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.end}
                    onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                             focus:ring-2 focus:ring-primary-500 focus:border-transparent
                             dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           dark:bg-gray-700 dark:text-white resize-none"
                  rows={4}
                  placeholder="Digite a descrição do evento"
                  maxLength={500}
                />
              </div>
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 
                           hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg text-sm font-medium text-white
                           bg-gradient-to-r from-primary-500 to-primary-600
                           hover:from-primary-600 hover:to-primary-700"
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