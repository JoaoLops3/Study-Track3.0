import { useState } from 'react';
import { ChevronLeft, Home, Github, Folder, File, Plus, PlusCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`flex flex-col h-full transition-all duration-200 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-center p-4 border-b dark:border-gray-700 cursor-pointer">
        <Image src="/logo-Study-Track.png" alt="Study Track Logo" width={32} height={32} className="mr-2" />
        {!isCollapsed && <h2 className="text-xl font-bold text-gray-900 dark:text-white">Study Track</h2>}
      </div>

      <nav className="flex-1 px-4 mt-4 overflow-y-auto">
        <Link href="/" className={`flex items-center px-3 py-2 mb-2 rounded-md transition-colors bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-100`}>
          <Home className="w-5 h-5 mr-3" />
          {!isCollapsed && <span>Dashboard</span>}
        </Link>

        <Link href="/github-repos" className={`flex items-center px-3 py-2 mb-2 rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800`}>
          <Github className="w-5 h-5 mr-3" />
          {!isCollapsed && <span>Meus Repositórios</span>}
        </Link>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2 group">
            {!isCollapsed && <h3 className="text-sm font-medium text-gray-500 uppercase">Boards</h3>}
            {!isCollapsed && (
              <button className="invisible group-hover:visible p-1 text-gray-400 rounded hover:text-gray-600 focus:outline-none" aria-label="Add board">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          <ul className="space-y-1">
            <li>
              <Link href="/board/73262a9b-9efa-4b58-af14-dffa9257ce01" className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800`}>
                <Folder className="w-4 h-4 mr-3 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">Meu Primeiro Board</span>}
              </Link>
            </li>
            <li>
              <Link href="/board/51fc7231-c3c5-4f91-8fe2-f8b687765d64" className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800`}>
                <Folder className="w-4 h-4 mr-3 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">Meu Primeiro Board</span>}
              </Link>
            </li>
            <li>
              <Link href="/board/709e63d3-ef7e-4fce-9cfa-ef4f9cbeeaf6" className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800`}>
                <Folder className="w-4 h-4 mr-3 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">board</span>}
              </Link>
            </li>
            <li>
              <button className={`flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800`}>
                <PlusCircle className="w-4 h-4 mr-3 text-gray-500" />
                {!isCollapsed && <span>New Board</span>}
              </button>
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2 group">
            {!isCollapsed && <h3 className="text-sm font-medium text-gray-500 uppercase">Pages</h3>}
            {!isCollapsed && (
              <button className="invisible group-hover:visible p-1 text-gray-400 rounded hover:text-gray-600 focus:outline-none" aria-label="Add page">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          <ul className="space-y-1">
            <li>
              <Link href="/page/b860707e-8479-416a-b990-a7ff3249f858" className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800`}>
                <File className="w-4 h-4 mr-3 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">Web</span>}
              </Link>
            </li>
            <li>
              <button className={`flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800`}>
                <PlusCircle className="w-4 h-4 mr-3 text-gray-500" />
                {!isCollapsed && <span>New Page</span>}
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="p-4 border-t">
        <button className={`flex items-center px-3 py-2 w-full text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800`}>
          <Settings className="w-5 h-5 mr-3" />
          {!isCollapsed && <span>Settings</span>}
        </button>
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute top-4 -right-3 p-1 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <ChevronLeft className={`w-6 h-6 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`} />
      </button>
    </div>
  );
} 