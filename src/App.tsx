import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import MainLayout from './components/layouts/MainLayout';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Toaster } from 'react-hot-toast';
import PrivateRoute from './components/PrivateRoute';
import Pomodoro from './pages/Pomodoro';
import { AuthCallback } from './components/auth/AuthCallback';
import { GoogleCallback } from './components/auth/GoogleCallback';

// Lazy load das páginas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Board = lazy(() => import('./pages/Board'));
const Login = lazy(() => import('./pages/Login'));
const Settings = lazy(() => import('./pages/Settings'));
const Page = lazy(() => import('./pages/Page'));
const CalendarPage = lazy(() => import('./pages/Calendar'));
const TeamPage = lazy(() => import('./pages/Team'));
const GithubRepos = lazy(() => import('./pages/GithubRepos'));

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <Toaster position="top-right" />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth/github/callback" element={<AuthCallback />} />
              <Route path="/auth/callback" element={<GoogleCallback />} />
              <Route element={<PrivateRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/board/:id" element={<Board />} />
                  <Route path="/page/:id" element={<Page />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/team" element={<TeamPage />} />
                  <Route path="/github" element={<GithubRepos />} />
                  <Route path="/pomodoro" element={<Pomodoro />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;