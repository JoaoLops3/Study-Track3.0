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

export async function getGoogleCalendarEvents(): Promise<GoogleEvent[]> {
  try {
    const response = await gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 100,
      orderBy: 'startTime'
    });

    return response.result.items || [];
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    throw error;
  }
}

export async function getGoogleCalendarTasks(): Promise<GoogleTask[]> {
  try {
    const response = await gapi.client.tasks.tasklists.list();
    const taskLists = response.result.items || [];
    
    const allTasks: GoogleTask[] = [];
    for (const taskList of taskLists) {
      const tasksResponse = await gapi.client.tasks.tasks.list({
        tasklist: taskList.id,
        showCompleted: true,
        showHidden: true
      });
      
      const tasks = tasksResponse.result.items || [];
      allTasks.push(...tasks.map(task => ({
        ...task,
        taskListId: taskList.id,
        taskListTitle: taskList.title
      })));
    }
    
    console.log('Tarefas obtidas:', allTasks);
    return allTasks;
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    throw error;
  }
}

export async function createGoogleCalendarEvent(event: {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}): Promise<GoogleEvent> {
  try {
    const response = await gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });

    return response.result;
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    throw error;
  }
} 