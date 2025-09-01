import { useState, useEffect } from 'react';
import { apiService } from '../services';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  

  // Verificar token al inicializar
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Simular validación de token
      try {
        setUser({
          id: 1,
          nombre: 'Usuario Demo',
          apellido: 'Sistema',
          email: 'demo@posai.com',
          telefono: '+54 9 11 1234-5678',
          sucursal: 'Sucursal Central',
          role: 'admin',
          avatar: ''
        });
      } catch (error) {
        localStorage.removeItem('auth_token');
      }
    }
    setIsInitialized(true);
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const result = await apiService.login(credentials);
      
      if (result.success) {
        setUser(result.user);
        return result;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      // Mock login exitoso para desarrollo
      const mockUser = {
        id: 1,
        nombre: credentials.username || 'Usuario Demo',
        apellido: 'Sistema',
        email: `${credentials.username || 'demo'}@posai.com`,
        telefono: '+54 9 11 1234-5678',
        sucursal: 'Sucursal Central',
        role: credentials.role || 'admin',
        avatar: ''
      };
      
      localStorage.setItem('auth_token', 'mock_token_' + Date.now());
      setUser(mockUser);
      
      return {
        success: true,
        user: mockUser,
        token: localStorage.getItem('auth_token')
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiService.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsLoading(false);
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    // Permisos específicos por rol
    const rolePermissions = {
      admin: ['admin', 'manage_system', 'read', 'write', 'sell', 'reports'],
      supervisor: ['read', 'write', 'sell', 'reports'],
      cajero: ['read', 'sell']
    };
    
    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
  };

  const updateUserProfile = async (profileData) => {
    setIsLoading(true);
    try {
      // Simular actualización del perfil
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      throw new Error('Error al actualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isSupervisor = user?.role === 'supervisor' || user?.role === 'admin';

  return {
    user,
    login,
    logout,
    updateUserProfile,
    isAuthenticated: !!user,
    isLoading,
    isInitialized,
    hasPermission,
    isAdmin,
    isSupervisor
  };
};

export default useAuth;