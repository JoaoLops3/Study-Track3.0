import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import MainLayout from './components/layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Page from './pages/Page';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import CalendarPage from './pages/Calendar';
import TeamPage from './pages/Team';

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-primary-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {user ? (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="board/:id" element={<Board />} />
            <Route path="settings" element={<Settings />} />
            <Route path="page/:id" element={<Page />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="team" element={<TeamPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      ) : (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <AppRoutes />
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;