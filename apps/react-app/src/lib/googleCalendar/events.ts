import { supabase } from '../supabase';
import { GoogleCalendarEvent, GoogleCalendarEventResponse } from './types';
import { retryWithExponentialBackoff, clearCache } from './utils';
import { checkGoogleConnection, getGoogleAccessToken } from './auth';

export async function getGoogleCalendarEvents(accessToken: string): Promise<GoogleCalendarEvent[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data: GoogleCalendarEventResponse = await response.json();
    return data.items.map(event => ({
      ...event,
      allDay: !event.start.dateTime,
    }));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  event: Omit<GoogleCalendarEvent, 'id'>
): Promise<GoogleCalendarEvent | null> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create calendar event');
    }

    const data: GoogleCalendarEvent = await response.json();
    return {
      ...data,
      allDay: !data.start.dateTime,
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  event: Partial<GoogleCalendarEvent>
): Promise<GoogleCalendarEvent | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update calendar event');
    }

    const data: GoogleCalendarEvent = await response.json();
    return {
      ...data,
      allDay: !data.start.dateTime,
    };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return null;
  }
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete calendar event');
    }

    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
}

function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
} 