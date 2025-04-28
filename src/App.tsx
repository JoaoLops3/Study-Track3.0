import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import MainLayout from './components/layouts/MainLayout';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Toaster } from 'react-hot-toast';
import PrivateRoute from './components/PrivateRoute';

// Lazy load das páginas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Board = lazy(() => import('./pages/Board'));
const Login = lazy(() => import('./pages/Login'));
const Settings = lazy(() => import('./pages/Settings'));
const Page = lazy(() => import('./pages/Page'));
const CalendarPage = lazy(() => import('./pages/Calendar'));
const TeamPage = lazy(() => import('./pages/Team'));
const GithubCallback = lazy(() => import('./pages/GithubCallback'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
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
              <Route path="/auth/github/callback" element={<GithubCallback />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/board/:id" element={<Board />} />
                <Route path="/page/:id" element={<Page />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/github" element={<GithubRepos />} />
              </Route>
            </Routes>
          </Suspense>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;