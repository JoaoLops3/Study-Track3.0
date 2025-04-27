import { useState, useEffect } from 'react';
import { Calendar, Loader2, CheckCircle, XCircle, Clock, CheckSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface GoogleCalendarProps {
  onClose: () => void;
}

interface Event {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  completed: boolean;
}

export default function GoogleCalendar({ onClose }: GoogleCalendarProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchTodayEvents();
    }
  }, [isConnected]);

  const checkConnection = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google_calendar')
        .single();

      if (error) throw error;
      setIsConnected(!!data);
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
    }
  };

  const fetchTodayEvents = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/calendar/today');
      if (!response.ok) throw new Error('Failed to fetch events');

      const data = await response.json();
      setEvents(data.events || []);
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching today events:', error);
      toast.error('Erro ao buscar eventos do dia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;

      await supabase
        .from('user_integrations')
        .upsert({
          user_id: user.id,
          provider: 'google_calendar',
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at
        });

      setIsConnected(true);
      toast.success('Google Calendar conectado com sucesso!');
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      toast.error('Erro ao conectar com o Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google_calendar');

      setIsConnected(false);
      setEvents([]);
      setTasks([]);
      toast.success('Google Calendar desconectado com sucesso!');
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast.error('Erro ao desconectar do Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Google Calendar</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <XCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Conecte sua conta do Google Calendar para sincronizar seus eventos e compromissos.
        </p>

        {isConnected ? (
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Conectado</span>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Desconectar'
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Conectar com Google Calendar'
            )}
          </button>
        )}
      </div>

      {isConnected && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Agenda do Dia
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Eventos do Google Calendar */}
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
                >
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-primary-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {event.summary}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(event.start.dateTime || event.start.date)} -{' '}
                        {formatTime(event.end.dateTime || event.end.date)}
                      </p>
                      {event.location && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Local: {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Tarefas do dia */}
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
                >
                  <div className="flex items-start">
                    <CheckSquare className={`w-5 h-5 mr-3 mt-0.5 ${task.completed ? 'text-green-600' : 'text-primary-600'}`} />
                    <div>
                      <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {task.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(task.due_date)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {events.length === 0 && tasks.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum evento ou tarefa encontrado para hoje.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 