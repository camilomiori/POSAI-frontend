import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Brain, 
  Users, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home
} from 'lucide-react';

export const Sidebar = ({ isOpen = true, onToggle, onNavigate, currentPath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      path: '/dashboard',
      description: 'Panel principal'
    },
    {
      id: 'ventas',
      label: 'Ventas',
      icon: ShoppingCart,
      path: '/ventas',
      description: 'Gestión de ventas'
    },
    {
      id: 'productos',
      label: 'Productos',
      icon: Package,
      path: '/productos',
      description: 'Inventario'
    },
    {
      id: 'ai-center',
      label: 'AI Center',
      icon: Brain,
      path: '/ai-center',
      description: 'Centro de IA'
    },
    {
      id: 'usuario',
      label: 'Usuario',
      icon: Users,
      path: '/usuario',
      description: 'Perfil de usuario'
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: Settings,
      path: '/configuracion',
      description: 'Configuración del sistema'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className={`h-full bg-white shadow-lg border-r border-gray-200 flex flex-col ${
      isOpen ? 'w-64' : 'w-20'
    } transition-all duration-300`}>
      {/* Header del sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {isOpen && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">POS AI</h1>
              <p className="text-xs text-gray-500">Sistema Inteligente</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={!isOpen ? item.label : ''}
            >
              <IconComponent className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              {isOpen && (
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer del sidebar - Información del usuario */}
      <div className="p-4 border-t border-gray-200">
        {isOpen ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Usuario Demo
                </p>
                <p className="text-xs text-gray-500">
                  Administrador
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <button
              onClick={handleLogout}
              className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg flex justify-center"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
