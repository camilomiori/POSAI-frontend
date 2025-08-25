import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Brain, 
  Users, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
  Bell,
  Shield,
  User,
  FileText,
  CreditCard,
  Archive
} from 'lucide-react';
import { useAuth } from '../../hooks';
import { USER_ROLES, NAVIGATION_SECTIONS } from '../../utils/constants';

const Sidebar = ({ 
  isOpen = true, 
  onToggle,
  currentSection = NAVIGATION_SECTIONS.DASHBOARD,
  onNavigate,
  className = '' 
}) => {
  const { user, hasPermission, isAdmin, isSupervisor, isCajero } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Definir elementos de navegación con permisos
  const navigationItems = useMemo(() => [
    {
      id: NAVIGATION_SECTIONS.DASHBOARD,
      label: 'Dashboard',
      icon: BarChart3,
      path: '/dashboard',
      permission: 'view_dashboard',
      badge: null,
      description: 'Panel principal con métricas'
    },
    {
      id: NAVIGATION_SECTIONS.VENTAS,
      label: 'Ventas',
      icon: ShoppingCart,
      path: '/ventas',
      permission: 'process_sales',
      badge: 'new',
      description: 'Procesar ventas y transacciones'
    },
    {
      id: NAVIGATION_SECTIONS.PRODUCTOS,
      label: 'Productos',
      icon: Package,
      path: '/productos',
      permission: isAdmin || isSupervisor ? 'manage_products' : 'view_products',
      badge: null,
      description: 'Gestionar inventario y catálogo'
    },
    {
      id: NAVIGATION_SECTIONS.AI_CENTER,
      label: 'Centro IA',
      icon: Brain,
      path: '/ai',
      permission: 'ai_center',
      badge: 'ai',
      description: 'Inteligencia artificial y análisis',
      aiFeature: true
    }
  ], [isAdmin, isSupervisor]);

  // Elementos de administración
  const adminItems = useMemo(() => [
    {
      id: 'users',
      label: 'Usuarios',
      icon: Users,
      path: '/admin/usuarios',
      permission: 'manage_users',
      description: 'Gestionar usuarios del sistema'
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: FileText,
      path: '/admin/reportes',
      permission: 'view_reports',
      description: 'Informes y analytics'
    },
    {
      id: 'payments',
      label: 'Pagos',
      icon: CreditCard,
      path: '/admin/pagos',
      permission: 'view_reports',
      description: 'Gestión de pagos y facturación'
    },
    {
      id: 'backup',
      label: 'Respaldos',
      icon: Archive,
      path: '/admin/respaldos',
      permission: 'system_config',
      description: 'Copias de seguridad'
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: Settings,
      path: '/admin/configuracion',
      permission: 'system_config',
      description: 'Configuración del sistema'
    }
  ], []);

  // Filtrar elementos según permisos
  const visibleItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const visibleAdminItems = adminItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const handleNavigation = (item) => {
    if (onNavigate) {
      onNavigate(item.id, item.path);
    }
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const getBadgeContent = (badge) => {
    switch (badge) {
      case 'new':
        return <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Nuevo</span>;
      case 'ai':
        return (
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-600 text-xs font-medium">IA</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 
          ${collapsed ? 'w-16' : 'w-64'} 
          bg-white/95 backdrop-blur-lg border-r border-neutral-200/50 shadow-lg
          transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 transition-all duration-300 ease-in-out
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200/50">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">POS AI</h2>
                <p className="text-xs text-gray-500">Sistema Inteligente</p>
              </div>
            </div>
          )}
          
          {/* Collapse Button - Desktop only */}
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            {collapsed ? 
              <ChevronRight className="w-4 h-4 text-gray-500" /> : 
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            }
          </button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="p-4 border-b border-neutral-200/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user?.nombre}</p>
                <div className="flex items-center gap-1">
                  {user?.role === USER_ROLES.ADMIN && <Shield className="w-3 h-3 text-red-500" />}
                  {user?.role === USER_ROLES.SUPERVISOR && <TrendingUp className="w-3 h-3 text-blue-500" />}
                  {user?.role === USER_ROLES.CAJERO && <User className="w-3 h-3 text-green-500" />}
                  <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {/* Main Navigation */}
          <div className="space-y-2">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25' 
                      : 'hover:bg-neutral-100 text-gray-700 hover:text-gray-900'
                    }
                    ${item.aiFeature && !isActive ? 'hover:bg-emerald-50 hover:text-emerald-700' : ''}
                  `}
                  title={collapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${
                    item.aiFeature && !isActive ? 'text-emerald-600' : ''
                  }`} />
                  
                  {!collapsed && (
                    <>
                      <span className="font-medium">{item.label}</span>
                      <div className="flex-1" />
                      {item.badge && getBadgeContent(item.badge)}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Admin Section */}
          {visibleAdminItems.length > 0 && (
            <div className="mt-8">
              {!collapsed && (
                <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Administración
                </h3>
              )}
              <div className="space-y-2 mt-2">
                {visibleAdminItems.map((item) => {
                  const Icon = item.icon;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-neutral-100 text-gray-700 hover:text-gray-900 transition-all duration-200"
                      title={collapsed ? item.label : ''}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-neutral-200/50">
            <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-900">IA Activa</span>
              </div>
              <p className="text-xs text-emerald-700">
                Sistema de inteligencia artificial optimizando tu negocio en tiempo real.
              </p>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-600">Analizando datos...</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;