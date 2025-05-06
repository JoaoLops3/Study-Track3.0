export const GOOGLE_CALENDAR_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
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
  redirectUri: window.location.origin + '/auth/callback',
  authorizedOrigins: [
    'http://localhost:5173',
    'https://study-track-3-0.vercel.app',
    'https://study-track-3-0-git-main-joaolops3.vercel.app'
  ],
  authorizedRedirectUris: [
    'http://localhost:5173/auth/callback',
    'https://study-track-3-0.vercel.app/auth/callback',
    'https://study-track-3-0-git-main-joaolops3.vercel.app/auth/callback'
  ]
}; 