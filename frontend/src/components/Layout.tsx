import React, { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem('theme') === 'dark'
  );

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#0b0f19] transition-colors duration-200">
      
      {/* SIMPLE NAVBAR */}
      <header className="sticky top-0 z-40 w-full glass border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-6 py-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-extrabold bg-gradient-to-r from-primary-500 to-indigo-600 bg-clip-text text-transparent">
            Giftstore Returns Portal
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {/* Dark Mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {user && (
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <span>{user.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Layout centered */}
      <div className="flex-1 flex justify-center py-8 px-4 md:px-8 max-w-5xl mx-auto w-full">
        <main className="w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default Layout;
