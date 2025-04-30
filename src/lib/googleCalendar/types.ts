export interface GoogleCalendarEvent {
  id: string;
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
  status: string;
  htmlLink: string;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  primary: boolean;
}

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture: string;
}

export interface GoogleConnectionStatus {
  isConnected: boolean;
  error?: string;
  userInfo?: GoogleUserInfo;
  calendars?: GoogleCalendar[];
} 