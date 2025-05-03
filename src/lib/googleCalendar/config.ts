export const GOOGLE_CALENDAR_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY || '',
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID || '',
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/tasks.readonly'
  ],
  discoveryDocs: [
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest'
  ],
  redirectUri: 'http://localhost:5173/auth/callback',
  authorizedOrigins: ['http://localhost:5173'],
  authorizedRedirectUris: ['http://localhost:5173/auth/callback']
}; 