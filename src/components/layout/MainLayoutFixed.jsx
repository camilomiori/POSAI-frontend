import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './HeaderFixed';
import { Sidebar } from './SidebarFixed';
import { useAuth } from '../../hooks';

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Redirigir al login si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Si no está autenticado, no renderizar el layout
  if (!isAuthenticated) {
    return null;
  }

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300`}>
        <Sidebar 
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
          onNavigate={handleNavigate}
          currentPath={location.pathname}
        />
      </div>

      {/* Main content area */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300 min-h-screen flex flex-col`}>
        {/* Header */}
        <Header 
          onSidebarToggle={handleSidebarToggle}
          user={user}
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
