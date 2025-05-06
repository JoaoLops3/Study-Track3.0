import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../navigation/Sidebar';
import { Header } from '../navigation/Header';
import FloatingCalculator from '../FloatingCalculator';
import FloatingPomodoro from '../FloatingPomodoro';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="flex flex-col md:flex-row">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-6 w-full max-w-[2000px] mx-auto">
          <Outlet />
        </main>
      </div>
      <FloatingCalculator />
      <FloatingPomodoro />
    </div>
  );
};

export default MainLayout;