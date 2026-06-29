import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0f19]">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary-200 dark:border-slate-800 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full absolute top-0 left-0 animate-spin"></div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
