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

const LoginBright = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        
        // Guardar preferencias si "recordarme" está activado
        if (rememberMe) {
          localStorage.setItem('remembered_user', formData.username);
          localStorage.setItem('remembered_role', formData.role);
        }
      } else {
        error('Credenciales incorrectas');
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
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-200/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-indigo-200/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-purple-200/15 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-xl animate-bounce">
            <Zap className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            POS AI System
          </h1>
          <p className="text-blue-800 mt-2 flex items-center justify-center gap-2 text-lg font-medium">
            <Brain className="w-5 h-5 text-blue-500" />
            Sistema Inteligente de Punto de Venta
          </p>
          <div className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-lg">
            <Sparkles className="w-4 h-4" />
            Powered by AI v2.1.0
          </div>
        </div>

        {/* Main Login Form */}
        <Card className="shadow-2xl border border-blue-100 bg-white backdrop-blur-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-blue-800 font-bold">Iniciar Sesión</CardTitle>
            <p className="text-blue-600 mt-2">Accede a tu cuenta para continuar</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Role Selector */}
              <div>
                <label className="block text-sm font-semibold text-blue-700 mb-3">
                  Tipo de Usuario
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.values(USER_ROLES).map(role => {
                    const labels = {
                      [USER_ROLES.ADMIN]: 'Admin',
                      [USER_ROLES.SUPERVISOR]: 'Supervisor', 
                      [USER_ROLES.CAJERO]: 'Cajero'
                    };
                    const icons = {
                      [USER_ROLES.ADMIN]: '👑',
                      [USER_ROLES.SUPERVISOR]: '👨‍💼',
                      [USER_ROLES.CAJERO]: '💰'
                    };

                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleInputChange('role', role)}
                        className={`p-3 rounded-xl text-center border-2 transition-all ${
                          formData.role === role 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg' 
                            : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600'
                        }`}
                      >
                        <div className="text-2xl mb-1">{icons[role]}</div>
                        <div className="text-xs font-medium">{labels[role]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-blue-700">
                  Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-blue-400" />
                  <Input
                    type="text"
                    placeholder="Ingrese su usuario"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="pl-10 h-12 border-2 border-blue-200 focus:border-blue-500 rounded-xl text-blue-800"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-blue-700">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-blue-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingrese su contraseña"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10 h-12 border-2 border-blue-200 focus:border-blue-500 rounded-xl text-blue-800"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-blue-400 hover:text-blue-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                    className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-blue-700">Recordarme</span>
                </label>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-8">
              <div className="text-center text-sm text-blue-600 mb-4 font-medium">
                Cuentas de demostración:
              </div>
              <div className="space-y-2">
                {demoAccounts.map(account => (
                  <button
                    key={account.username}
                    onClick={() => handleDemoLogin(account)}
                    className="w-full p-3 text-left border border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all"
                  >
                    <div className="font-medium text-blue-800">{account.label}</div>
                    <div className="text-sm text-blue-600">
                      {account.username} / {account.password}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginBright;
