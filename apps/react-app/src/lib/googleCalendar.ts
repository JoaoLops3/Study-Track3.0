import { GOOGLE_CALENDAR_CONFIG } from './googleCalendar/config';
import { supabase } from './supabase';

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status?: string;
  completed?: string;
  position?: string;
  taskListId: string;
  taskListTitle: string;
}

export interface GoogleEvent {
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

export { checkGoogleConnection } from './googleCalendar/auth';
// Removido todo o código relacionado ao gapi e métodos antigos do Google. 