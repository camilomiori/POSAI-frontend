import React, { useState, useEffect } from 'react';
import { Header, Sidebar, useResponsiveLayout } from './';
import { useAuth } from '../../hooks';
import { NAVIGATION_SECTIONS } from '../../utils/constants';

const MainLayout = ({ 
  children, 
  currentSection = NAVIGATION_SECTIONS.DASHBOARD,
  onNavigate,
  className = ''
}) => {
  const { isAuthenticated, user } = useAuth();
  const { isMobile, sidebarOpen, setSidebarOpen, toggleSidebar } = useResponsiveLayout();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(false); // Always expanded when shown on mobile
    }
  }, [isMobile]);

  // Handle navigation
  const handleNavigation = (sectionId, path) => {
    if (onNavigate) {
      onNavigate(sectionId, path);
    }
    
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">!</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Requerido</h2>
          <p className="text-gray-600">Necesitas iniciar sesión para acceder al sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 ${className}`}>
      
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        currentSection={currentSection}
        onNavigate={handleNavigation}
        collapsed={sidebarCollapsed && !isMobile}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${
        isMobile 
          ? 'lg:ml-0' 
          : sidebarCollapsed 
            ? 'lg:ml-16' 
            : 'lg:ml-64'
      }`}>
        
        {/* Header */}
        <Header
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          currentSection={currentSection}
        />

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-neutral-200/50 bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">POS AI System</span>
                </div>
                <div className="text-xs text-gray-500">
                  v2.1.0 • {user?.nombre} • {user?.role}
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-gray-500">
                <span>© 2024 POS AI System</span>
                <button className="hover:text-gray-700 transition-colors">
                  Soporte
                </button>
                <button className="hover:text-gray-700 transition-colors">
                  Documentación
                </button>
                <button className="hover:text-gray-700 transition-colors">
                  Estado del Sistema
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Loading Overlay */}
      <div id="loading-overlay" className="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-6 flex items-center gap-3 shadow-2xl">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-900 font-medium">Cargando...</span>
        </div>
      </div>

      {/* Toast Container */}
      <div id="toast-container" className="fixed top-4 right-4 z-50 space-y-2">
        {/* Toasts will be injected here by useToast hook */}
      </div>
    </div>
  );
};

export default MainLayout;