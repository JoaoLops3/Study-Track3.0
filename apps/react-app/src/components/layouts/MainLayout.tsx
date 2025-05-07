import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../navigation/Sidebar";
import { Header } from "../navigation/Header";
import FloatingCalculator from "../FloatingCalculator";
import FloatingPomodoro from "../FloatingPomodoro";
import { Menu } from "lucide-react";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {!isSidebarOpen && (
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-800 shadow"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
      )}
      <div className="flex">
        {isSidebarOpen && (
          <Sidebar
            logo={<span>Study Track</span>}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}
        <main
          className={`flex-1 p-4 md:p-6 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-0"
          } w-full max-w-[2000px] mx-auto`}
        >
          <Outlet />
        </main>
      </div>
      <FloatingCalculator />
      <FloatingPomodoro />
    </div>
  );
};

export default MainLayout;
