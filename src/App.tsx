import { Routes, Route } from 'react-router-dom';
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
import GithubCallback from './pages/GithubCallback';
import AuthCallback from './pages/AuthCallback';
import PrivateRoute from './components/PrivateRoute';
import GithubRepos from './pages/GithubRepos';

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
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/github/callback" element={<GithubCallback />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="board/:id" element={<Board />} />
              <Route path="settings" element={<Settings />} />
              <Route path="page/:id" element={<Page />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="github-repos" element={<GithubRepos />} />
            </Route>
            <Route path="*" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          </Routes>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;