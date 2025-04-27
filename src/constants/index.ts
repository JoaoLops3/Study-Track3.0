// Constantes de Acessibilidade
export const FONT_SIZES = {
  SMALL: 'text-sm',
  MEDIUM: 'text-base',
  LARGE: 'text-lg',
  XLARGE: 'text-xl'
};

// Constantes de Autenticação
export const AUTH = {
  GOOGLE_REDIRECT: process.env.NODE_ENV === 'production' 
    ? 'https://study-track3-0.vercel.app'
    : 'http://localhost:5173',
  CALLBACK_PATH: '/auth/callback'
};

// Constantes de Rota
export const ROUTES = {
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  AUTH_CALLBACK: '/auth/callback'
};

// Constantes de Tema
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark'
}; 