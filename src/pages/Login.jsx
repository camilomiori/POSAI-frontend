import React, { useState, useEffect } from 'react';
import {
  LogIn,
  Eye,
  EyeOff,
  User,
  Lock,
  Zap,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle,
  Brain,
  Sparkles
} from 'lucide-react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui';
import { useAuth, useToast } from '../hooks';
import { USER_ROLES } from '../utils/constants';

const Login = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const { success, error, ai } = useToast();

  // Estados del formulario
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: USER_ROLES.CAJERO
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);

  // Demo credentials
  const demoAccounts = [
    { username: 'admin', password: 'admin123', role: USER_ROLES.ADMIN, label: 'Administrador' },
    { username: 'supervisor', password: 'super123', role: USER_ROLES.SUPERVISOR, label: 'Supervisor' },
    { username: 'cajero', password: 'cajero123', role: USER_ROLES.CAJERO, label: 'Cajero' }
  ];

  // Redirect si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  // Manejo del bloqueo por intentos fallidos
  useEffect(() => {
    if (blockTimer > 0) {
      const timer = setInterval(() => {
        setBlockTimer(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [blockTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isBlocked) {
      error(`Cuenta bloqueada. Espere ${blockTimer} segundos.`);
      return;
    }

    if (!formData.username || !formData.password) {
      error('Ingrese usuario y contraseña');
      return;
    }

    try {
      const result = await login({
        username: formData.username,
        password: formData.password,
        role: formData.role
      });

      if (result.success) {
        success(`¡Bienvenido, ${result.user.nombre}!`);
        ai('Sistema de IA inicializado correctamente');
        
        // Guardar preferencias si "recordarme" está activado
        if (rememberMe) {
          localStorage.setItem('remembered_user', formData.username);
          localStorage.setItem('remembered_role', formData.role);
        }
        
        // Redirect será manejado por el useEffect
      } else {
        setLoginAttempts(prev => prev + 1);
        
        if (loginAttempts >= 4) { // 5 intentos máximo
          setIsBlocked(true);
          setBlockTimer(300); // 5 minutos de bloqueo
          error('Demasiados intentos fallidos. Cuenta bloqueada por 5 minutos.');
        } else {
          error(`Credenciales incorrectas. Intentos restantes: ${4 - loginAttempts}`);
        }
      }
    } catch (err) {
      error('Error de conexión. Intente nuevamente.');
    }
  };

  const handleDemoLogin = (demoAccount) => {
    setFormData({
      username: demoAccount.username,
      password: demoAccount.password,
      role: demoAccount.role
    });
    ai(`Credenciales demo cargadas: ${demoAccount.label}`);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Cargar usuario recordado
  useEffect(() => {
    const rememberedUser = localStorage.getItem('remembered_user');
    const rememberedRole = localStorage.getItem('remembered_role');
    
    if (rememberedUser && rememberedRole) {
      setFormData(prev => ({
        ...prev,
        username: rememberedUser,
        role: rememberedRole
      }));
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 flex items-center justify-center p-6">
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-200/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-cyan-200/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl mb-6 shadow-2xl">
            <Zap className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            POS AI System
          </h1>
          <p className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <Brain className="w-4 h-4 text-emerald-500" />
            Sistema Inteligente de Punto de Venta
          </p>
          <Badge variant="ai" className="mt-3">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by AI v2.1.0
          </Badge>
        </div>

        {/* Main Login Form */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-center text-gray-900">Iniciar Sesión</CardTitle>
            {isBlocked && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">
                  Cuenta bloqueada por {Math.floor(blockTimer / 60)}:{(blockTimer % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Role Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Usuario
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(USER_ROLES).map(role => {
                    const labels = {
                      [USER_ROLES.ADMIN]: 'Admin',
                      [USER_ROLES.SUPERVISOR]: 'Supervisor', 
                      [USER_ROLES.CAJERO]: 'Cajero'
                    };
                    
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleInputChange('role', role)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          formData.role === role
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg'
                            : 'bg-white/70 text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {labels[role]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Username Field */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Ingrese su usuario"
                    className="pl-12"
                    disabled={isLoading || isBlocked}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Ingrese su contraseña"
                    className="pl-12 pr-12"
                    disabled={isLoading || isBlocked}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading || isBlocked}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    disabled={isLoading || isBlocked}
                  />
                  <span className="ml-2 text-sm text-gray-600">Recordarme</span>
                </label>
                
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  disabled={isLoading || isBlocked}
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                disabled={isLoading || isBlocked || !formData.username || !formData.password}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Iniciando sesión...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Iniciar Sesión
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card className="mt-6 shadow-lg border-0 bg-white/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-center text-sm text-gray-700">
              <Shield className="w-4 h-4 inline mr-2" />
              Cuentas de Demostración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoAccounts.map((account, index) => (
                <button
                  key={index}
                  onClick={() => handleDemoLogin(account)}
                  disabled={isLoading || isBlocked}
                  className="w-full p-3 text-left border rounded-xl hover:bg-white/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{account.label}</p>
                      <p className="text-sm text-gray-500">
                        Usuario: {account.username} | Contraseña: {account.password}
                      </p>
                    </div>
                    <Badge variant="secondary" size="sm">
                      Demo
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50/50 border border-blue-200/50 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Modo Demostración Activo</p>
                  <p className="text-xs">
                    Puede usar cualquiera de las cuentas demo para probar el sistema. 
                    Todos los datos son simulados y seguros.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 POS AI System. Todos los derechos reservados.</p>
          <p className="mt-1">
            Powered by <span className="text-emerald-600 font-medium">Artificial Intelligence</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;