import { Outlet } from 'react-router-dom';
import { Book } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left column - Image and branding */}
      <div className="hidden md:flex md:w-1/2 bg-primary-600 dark:bg-primary-700 flex-col items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center mb-6">
            <Book className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Study Track</h1>
          <p className="text-primary-100 text-lg">
            Organize your learning journey with our powerful kanban boards and rich text editing.
            Take notes, track progress, and collaborate with others in one place.
          </p>
        </div>
      </div>

      {/* Right column - Auth form */}
      <div className="flex flex-col justify-center w-full md:w-1/2 py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex items-center justify-center md:hidden mb-6">
            <Book className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white md:hidden">
            Study Track
          </h2>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout