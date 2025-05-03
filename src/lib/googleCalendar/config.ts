export const GOOGLE_CALENDAR_CONFIG = {
  apiKey: 'AIzaSyBxQwXQwXQwXQwXQwXQwXQwXQwXQwXQwXQ',
  clientId: '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com',
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.events.readonly',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ],
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
  redirectUri: 'http://localhost:5173/auth/callback',
  authorizedOrigins: ['http://localhost:5173'],
  authorizedRedirectUris: ['http://localhost:5173/auth/callback']
}; 