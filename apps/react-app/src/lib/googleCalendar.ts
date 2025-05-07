import { supabase } from "./supabase";

declare global {
  interface Window {
    gapi: any;
  }
}

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

export const initializeGoogleApi = async () => {
  try {
    await new Promise((resolve, reject) => {
      window.gapi.load("client", {
        callback: resolve,
        onerror: reject,
      });
    });

    await window.gapi.client.init({
      apiKey: process.env.VITE_GOOGLE_API_KEY,
      clientId: process.env.VITE_GOOGLE_CLIENT_ID,
      discoveryDocs: [
        "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
        "https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest",
      ],
      scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks",
    });

    return true;
  } catch (error) {
    console.error("Error initializing Google API:", error);
    return false;
  }
};

export const getGoogleCalendarEvents = async () => {
  try {
    const response = await window.gapi.client.calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.result.items;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return [];
  }
};

export const getGoogleTasks = async (): Promise<GoogleTask[]> => {
  try {
    const response = await window.gapi.client.tasks.tasklists.list();
    const taskLists = response.result.items;
    const allTasks: GoogleTask[] = [];

    for (const list of taskLists) {
      const tasksResponse = await window.gapi.client.tasks.tasks.list({
        tasklist: list.id,
      });

      const tasks = tasksResponse.result.items || [];
      allTasks.push(
        ...tasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          notes: task.notes,
          due: task.due,
          status: task.status,
          completed: task.completed,
          position: task.position,
          taskListId: list.id,
          taskListTitle: list.title,
        }))
      );
    }

    return allTasks;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
};

export const createGoogleCalendarEvent = async (event: {
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
}) => {
  try {
    const response = await window.gapi.client.calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    return response.result;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw error;
  }
}; 