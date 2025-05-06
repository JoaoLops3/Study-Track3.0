import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import Sidebar from '@/components/layout/Sidebar';
import { ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { TeamProvider } from '../contexts/TeamContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const inter = Inter({ subsets: ['latin'] });

const queryClient = new QueryClient();

export const metadata = {
  title: 'Study Track',
  description: 'Acompanhe seus estudos e projetos',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AuthProvider>
                <SettingsProvider>
                  <ThemeProvider>
                    <ToastProvider>
                      <TeamProvider>
                        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                          <Providers>
                            <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                              <Sidebar />
                              <main className="flex-1 overflow-y-auto">
                                {children}
                              </main>
                            </div>
                          </Providers>
                          <Toaster position="top-right" />
                        </GoogleOAuthProvider>
                      </TeamProvider>
                    </ToastProvider>
                  </ThemeProvider>
                </SettingsProvider>
              </AuthProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </HelmetProvider>
      </body>
    </html>
  );
} 