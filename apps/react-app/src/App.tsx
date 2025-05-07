import { Routes, Route, BrowserRouter } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import MainLayout from "./components/layouts/MainLayout";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { Toaster } from "react-hot-toast";
import PrivateRoute from "./components/PrivateRoute";
import Pomodoro from "./pages/Pomodoro";
import { AuthCallback } from "./components/auth/AuthCallback";
import { GoogleCallback } from "./components/auth/GoogleCallback";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { PomodoroProvider } from "./contexts/PomodoroContext";

// Lazy load das páginas
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Board = lazy(() => import("./pages/Board"));
const Login = lazy(() => import("./pages/Login"));
const Settings = lazy(() => import("./pages/Settings"));
const Page = lazy(() => import("./pages/Page"));
const TeamPage = lazy(() => import("./pages/Team"));
const TeamInvite = lazy(() => import("./pages/TeamInvite"));
const GithubRepos = lazy(() => import("./pages/GithubRepos"));
const CalendarPage = lazy(() => import("./pages/Calendar"));

const LoadingFallback = () => (
  <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
    <LoadingSpinner size="lg" />
    <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        <ThemeProvider>
          <SettingsProvider>
            <GoogleOAuthProvider
              clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
            >
              <PomodoroProvider>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: "#333",
                      color: "#fff",
                    },
                  }}
                />
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route
                      path="/auth/github/callback"
                      element={<AuthCallback />}
                    />
                    <Route path="/auth/callback" element={<GoogleCallback />} />
                    <Route path="/login" element={<Login />} />
                    <Route element={<PrivateRoute />}>
                      <Route element={<MainLayout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/board/:id" element={<Board />} />
                        <Route path="/page/:id" element={<Page />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/team" element={<TeamPage />} />
                        <Route
                          path="/team/invite/:inviteId"
                          element={<TeamInvite />}
                        />
                        <Route path="/github" element={<GithubRepos />} />
                        <Route path="/pomodoro" element={<Pomodoro />} />
                        <Route path="/calendar" element={<CalendarPage />} />
                      </Route>
                    </Route>
                  </Routes>
                </Suspense>
              </PomodoroProvider>
            </GoogleOAuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
