import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamProvider } from '../contexts/TeamContext';
import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TeamProvider>
            <SettingsProvider>
              <ThemeProvider>
                <ToastProvider>
                  <div className="min-h-screen bg-background">
                    {children}
                    <Toaster position="top-right" />
                  </div>
                </ToastProvider>
              </ThemeProvider>
            </SettingsProvider>
          </TeamProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
} 