// hooks/useAuth.js
import { useState, useCallback, useEffect } from 'react';
import { USER_ROLES, STORAGE_KEYS, SYSTEM_LIMITS } from '../utils/constants';

const useAuth = () => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(null);

  // Save user to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (error) {
      console.warn('Failed to save user to localStorage:', error);
    }
  }, [user]);

  // Session timeout management
  useEffect(() => {
    if (user) {
      const timeout = setTimeout(() => {
        logout();
      }, SYSTEM_LIMITS.SESSION_TIMEOUT);
      
      setSessionTimeout(timeout);
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [user]);

  // Reset session timeout on user activity
  const resetSessionTimeout = useCallback(() => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }
    
    if (user) {
      const timeout = setTimeout(() => {
        logout();
      }, SYSTEM_LIMITS.SESSION_TIMEOUT);
      
      setSessionTimeout(timeout);
    }
  }, [sessionTimeout, user]);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication - In real app, this would be an API call
      const mockUser = {
        id: 1,
        nombre: credentials.username || 'Usuario Demo',
        email: `${credentials.username || 'demo'}@posai.com`,
        role: credentials.role || USER_ROLES.CAJERO,
        username: credentials.username || 'demo',
        loginTime: Date.now(),
        lastActivity: Date.now(),
        permissions: getPermissionsByRole(credentials.role || USER_ROLES.CAJERO)
      };
      
      setUser(mockUser);
      return { success: true, user: mockUser };
      
    } catch (error) {
      return { 
        success: false, 
        error: 'Error de autenticación. Verifique sus credenciales.' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
    // Clear other related storage
    localStorage.removeItem(STORAGE_KEYS.CART);
  }, [sessionTimeout]);

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { 
      ...prev, 
      ...updates, 
      lastActivity: Date.now() 
    } : null);
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock password change
      updateUser({ lastPasswordChange: Date.now() });
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: 'Error al cambiar la contraseña' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [updateUser]);

  // Helper function to get permissions by role
  const getPermissionsByRole = (role) => {
    const permissions = {
      [USER_ROLES.ADMIN]: [
        'view_dashboard',
        'manage_products',
        'process_sales',
        'view_reports',
        'manage_users',
        'system_config',
        'ai_center',
        'bulk_operations'
      ],
      [USER_ROLES.CAJERO]: [
        'view_dashboard',
        'view_products',
        'process_sales',
        'view_own_reports',
        'ai_recommendations'
      ],
      [USER_ROLES.SUPERVISOR]: [
        'view_dashboard',
        'manage_products',
        'process_sales',
        'view_reports',
        'ai_center'
      ]
    };
    
    return permissions[role] || permissions[USER_ROLES.CAJERO];
  };

  // Permission check helper
  const hasPermission = useCallback((permission) => {
    return user?.permissions?.includes(permission) || false;
  }, [user]);

  // Role check helpers
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const isCajero = user?.role === USER_ROLES.CAJERO;
  const isSupervisor = user?.role === USER_ROLES.SUPERVISOR;
  const isAuthenticated = !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isCajero,
    isSupervisor,
    login,
    logout,
    updateUser,
    changePassword,
    hasPermission,
    resetSessionTimeout
  };
};

export default useAuth;