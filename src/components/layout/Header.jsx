import React, { useState } from 'react';
import { 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { Button } from '../ui';
import { useAuth, useNotifications } from '../../hooks';
import { formatDateTime } from '../../utils/formatters';
import { USER_ROLES, APP_CONFIG } from '../../utils/constants';

const Header = ({ 
  onToggleSidebar, 
  sidebarOpen = false,
  className = '' 
}) => {
  const { user, logout, isAdmin, isSupervisor } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    if (window.confirm('¿Está seguro que desea cerrar sesión?')) {
      logout();
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setShowNotifications(false);
  };

  const getNotificationIcon = (type) => {
    const icons = {
      success: '✅',
      error: '❌', 
      warning: '⚠️',
      info: 'ℹ️',
      ai: '🤖'
    };
    return icons[type] || 'ℹ️';
  };

  const getRoleBadge = (role) => {
    const badges = {
      [USER_ROLES.ADMIN]: { label: 'Admin', color: 'bg-red-100 text-red-800', icon: Shield },
      [USER_ROLES.SUPERVISOR]: { label: 'Supervisor', color: 'bg-blue-100 text-blue-800', icon: Activity },
      [USER_ROLES.CAJERO]: { label: 'Cajero', color: 'bg-green-100 text-green-800', icon: User }
    };
    return badges[role] || badges[USER_ROLES.CAJERO];
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <header className={`bg-white/80 backdrop-blur-sm border-b border-neutral-200/50 shadow-sm ${className}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Section - Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {APP_CONFIG.NAME}
                </h1>
                <p className="text-xs text-neutral-500">v{APP_CONFIG.VERSION}</p>
              </div>
            </div>
          </div>

          {/* Right Section - Notifications & User */}
          <div className="flex items-center gap-3">
            
            {/* AI Status Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">IA Activa</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-neutral-200/50 z-50">
                  <div className="p-4 border-b border-neutral-200">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                      <span className="text-sm text-gray-500">{unreadCount} nuevas</span>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay notificaciones</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100">
                        {notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 hover:bg-neutral-50 cursor-pointer transition-colors ${
                              !notification.read ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-lg flex-shrink-0">
                                {getNotificationIcon(notification.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                                  {notification.title}
                                </p>
                                {notification.message && (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatDateTime(notification.timestamp)}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-neutral-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-sm"
                        onClick={() => setShowNotifications(false)}
                      >
                        Ver todas las notificaciones
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 rounded-2xl hover:bg-neutral-100/80 transition-colors"
              >
                {/* Avatar */}
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>

                {/* User Info - Hidden on mobile */}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.nombre || 'Usuario'}
                  </p>
                  <div className="flex items-center gap-1">
                    <roleBadge.icon className="w-3 h-3" />
                    <span className="text-xs text-gray-500">{roleBadge.label}</span>
                  </div>
                </div>

                <ChevronDown className="w-4 h-4 text-gray-500 hidden md:block" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-neutral-200/50 z-50">
                  {/* User Info Header */}
                  <div className="p-4 border-b border-neutral-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg font-semibold">
                          {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user?.nombre}</p>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${roleBadge.color}`}>
                          <roleBadge.icon className="w-3 h-3" />
                          {roleBadge.label}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100 transition-colors text-left">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Mi Perfil</span>
                    </button>

                    <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100 transition-colors text-left">
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Configuración</span>
                    </button>

                    <div className="border-t border-neutral-200 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition-colors text-left text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside handlers */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;