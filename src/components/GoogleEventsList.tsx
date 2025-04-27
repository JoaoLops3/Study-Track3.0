import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getGoogleCalendarEvents } from '../services/googleCalendar';

export function GoogleEventsList() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    getGoogleCalendarEvents(user.id)
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div>Carregando eventos do Google Calendar...</div>;
  if (error) return <div style={{ color: 'red' }}>Erro: {error}</div>;
  if (!events.length) return <div>Nenhum evento encontrado.</div>;

  return (
    <ul className="space-y-2 mt-4">
      {events.map(event => (
        <li key={event.id} className="p-2 border rounded">
          <strong>{event.summary || 'Sem título'}</strong>
          <br />
          {event.start?.dateTime || event.start?.date}
        </li>
      ))}
    </ul>
  );
} 