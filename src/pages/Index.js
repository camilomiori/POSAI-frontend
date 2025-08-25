// Páginas principales del sistema
export { default as Dashboard } from './Dashboard';
export { default as Ventas } from './Ventas';

// Páginas que se desarrollarán después
export { default as Productos } from './Productos';
export { default as AICenter } from './AICenter';
export { default as Login } from './Login';
export { default as Admin } from './Admin';

// Configuración de rutas
export const routes = {
  dashboard: {
    path: '/dashboard',
    component: 'Dashboard',
    title: 'Dashboard',
    permission: 'view_dashboard',
    icon: 'BarChart3'
  },
  ventas: {
    path: '/ventas',
    component: 'Ventas',
    title: 'Ventas',
    permission: 'process_sales',
    icon: 'ShoppingCart'
  },
  productos: {
    path: '/productos',
    component: 'Productos',
    title: 'Productos',
    permission: 'view_products',
    icon: 'Package'
  },
  ai: {
    path: '/ai',
    component: 'AICenter',
    title: 'Centro IA',
    permission: 'ai_center',
    icon: 'Brain'
  },
  admin: {
    path: '/admin',
    component: 'Admin',
    title: 'Administración',
    permission: 'manage_users',
    icon: 'Settings'
  },
  login: {
    path: '/login',
    component: 'Login',
    title: 'Iniciar Sesión',
    public: true,
    icon: 'LogIn'
  }
};

// Helper para obtener rutas por permisos
export const getRoutesForUser = (userPermissions = []) => {
  return Object.entries(routes).filter(([key, route]) => {
    if (route.public) return true;
    if (!route.permission) return true;
    return userPermissions.includes(route.permission);
  });
};