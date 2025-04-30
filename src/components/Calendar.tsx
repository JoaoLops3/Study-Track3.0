import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getGoogleCalendarEvents } from '../lib/googleCalendar';
import { supabase } from '../lib/supabase';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

interface Event {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  google_event_id?: string;
}

export function Calendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  async function loadEvents() {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar eventos do Google Calendar
      const googleEvents = await getGoogleCalendarEvents();
      console.log('Eventos do Google recebidos:', googleEvents);

      // Converter eventos para o formato do react-big-calendar
      const formattedEvents = googleEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: new Date(event.start_date),
        end: new Date(event.end_date),
        google_event_id: event.google_event_id
      }));

      console.log('Eventos formatados:', formattedEvents);
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleSync() {
    try {
      setSyncing(true);
      setError(null);
      await loadEvents();
    } catch (err) {
      console.error('Erro na sincronização:', err);
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar eventos');
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="h-[600px] p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Calendário</h2>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {syncing ? 'Sincronizando...' : 'Sincronizar'}
        </button>
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
      />
    </div>
  );
} 