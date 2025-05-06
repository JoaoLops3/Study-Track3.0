import { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/calendar.css';
import { useTheme } from '../contexts/ThemeContext';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CALENDAR_CONFIG } from '../lib/googleCalendar/config';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Clock, Calendar as CalendarIcon } from 'lucide-react';

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { theme } = useTheme();
  const { events, isLoading, error, login } = useGoogleCalendar();
  const [isConnected, setIsConnected] = useState(false);

  // Detecta conexão pelo carregamento dos eventos
  useMemo(() => {
    if (events.length > 0) setIsConnected(true);
  }, [events]);

  // Função para verificar se uma data tem eventos
  const hasEvents = (date: Date) => {
    return events.some(event => {
      const eventDate = event.start.dateTime 
        ? parseISO(event.start.dateTime)
        : parseISO(event.start.date);
      return isSameDay(eventDate, date);
    });
  };

  // Função para obter os eventos de uma data específica
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = event.start.dateTime 
        ? parseISO(event.start.dateTime)
        : parseISO(event.start.date);
      return isSameDay(eventDate, date);
    });
  };

  // Estilização do calendário baseada no tema
  const calendarClassName = useMemo(() => {
    // Remover classes utilitárias Tailwind conflitantes
    return theme === 'dark'
      ? 'calendar-dark react-calendar mb-6 w-full'
      : 'calendar-light react-calendar mb-6 w-full';
  }, [theme]);

  // Estilização dos dias do calendário
  const tileClassName = ({ date }: { date: Date }) => {
    const baseClasses = theme === 'dark'
      ? 'dark:!bg-gray-800 dark:!text-gray-100 dark:hover:!bg-gray-700'
      : '!bg-white !text-gray-900 hover:!bg-gray-100';
    
    const hasEventClass = hasEvents(date)
      ? 'react-calendar__tile--hasEvent'
      : '';

    return `${baseClasses} ${hasEventClass}`;
  };

  // Formatar data/hora do evento
  const formatEventDateTime = (event: any) => {
    if (event.start.dateTime) {
      const start = parseISO(event.start.dateTime);
      const end = parseISO(event.end.dateTime);
      return {
        date: format(start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
        time: `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
      };
    } else {
      const start = parseISO(event.start.date);
      const end = parseISO(event.end.date);
      return {
        date: format(start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
        time: 'Dia inteiro'
      };
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CALENDAR_CONFIG.clientId}>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Calendário</h1>
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-sm font-medium"
          >
            Hoje
          </button>
        </div>
        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          className={calendarClassName}
          tileClassName={tileClassName}
          locale="pt-BR"
          formatDay={(locale, date) => format(date, 'd', { locale: ptBR })}
        />
        
        <div className="space-y-4 mt-8">
          <button
            onClick={() => login()}
            className={`px-4 py-2 rounded transition-colors ${
              isConnected
                ? 'bg-green-600 text-white hover:bg-green-700 cursor-default' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={isConnected}
          >
            {isConnected ? 'Conectado com Google' : 'Conectar com Google'}
          </button>

          {isLoading && (
            <p className="text-gray-600 dark:text-gray-300">Carregando eventos...</p>
          )}

          {error && (
            <p className="text-red-500">{error}</p>
          )}

          {events.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">
                Eventos para {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </h2>
              <ul className="event-list">
                {getEventsForDate(selectedDate).map((event) => {
                  const dateTime = formatEventDateTime(event);
                  return (
                    <li key={event.id} className="event-item">
                      <div className="event-title">{event.summary}</div>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {dateTime.date}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-2" />
                          {dateTime.time}
                        </div>
                        {event.location && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <MapPin className="w-4 h-4 mr-2" />
                            {event.location}
                          </div>
                        )}
                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
                {getEventsForDate(selectedDate).length === 0 && (
                  <li className="event-item event-item-empty">
                    Nenhum evento para esta data.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default CalendarPage; 