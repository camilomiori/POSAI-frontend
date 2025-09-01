import React, { useState, useEffect } from 'react';
import {
  User,
  Edit,
  Camera,
  Lock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Badge as BadgeIcon,
  Activity,
  TrendingUp,
  DollarSign,
  Clock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Zap,
  Star,
  Award,
  Target,
  BarChart3,
  Settings,
  Bell,
  Shield,
  LogOut,
  RefreshCw,
  Download
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Checkbox,
  Select
} from '../components/ui';
import { LineChart } from '../components/charts/ChartsSimple';
import { useAuth } from '../hooks';
import useToast from '../hooks/useToast';
import { apiService, getAiEngine } from '../services';
import { formatARS, formatDateTime, formatPercentage } from '../utils/formatters';
import { USER_ROLES } from '../utils/constants';

const Usuario = () => {
  const { user, updateUserProfile, logout } = useAuth();
  const { success, error, warning, ai } = useToast();

  // Estados principales
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState([]);
  const [performanceInsights, setPerformanceInsights] = useState([]);
  const [goalProgress, setGoalProgress] = useState(null);
  const [personalizedTips, setPersonalizedTips] = useState([]);
  
  // Estados para modales
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  
  // Form data
  const [profileForm, setProfileForm] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    sucursal: user?.sucursal || '',
    avatar: user?.avatar || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferencesForm, setPreferencesForm] = useState({
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      lowStock: true,
      dailyReports: false
    },
    language: 'es',
    autoLogout: 30
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Cargar datos del usuario
  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [
        statsResponse,
        activityResponse,
        salesResponse,
        recommendationsResponse,
        insightsResponse,
        goalsResponse,
        tipsResponse
      ] = await Promise.all([
        apiService.getUserStats(user.id),
        apiService.getUserActivity(user.id, { limit: 20 }),
        apiService.getUserSalesHistory(user.id, { days: 30 }),
        aiEngine.getPersonalizedRecommendations(user.id),
        aiEngine.getPerformanceInsights(user.id),
        aiEngine.getGoalProgress(user.id),
        aiEngine.getPersonalizedTips(user.id)
      ]);

      setUserStats(statsResponse);
      setUserActivity(activityResponse.data || []);
      setSalesHistory(salesResponse.data || []);
      setPersonalizedRecommendations(recommendationsResponse || []);
      setPerformanceInsights(insightsResponse || []);
      setGoalProgress(goalsResponse);
      setPersonalizedTips(tipsResponse || []);
      
      ai(`Dashboard personal actualizado con recomendaciones de IA`);
      
      // Cargar preferencias guardadas
      const preferences = localStorage.getItem(`user_preferences_${user.id}`);
      if (preferences) {
        setPreferencesForm({ ...preferencesForm, ...JSON.parse(preferences) });
      }

    } catch (err) {
      error('Error al cargar datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      await updateUserProfile(profileForm);
      success('Perfil actualizado exitosamente');
      setShowProfileModal(false);
    } catch (err) {
      error('Error al actualizar perfil');
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      warning('Complete todos los campos de contrase�a');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      warning('Las contrase�as nuevas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      warning('La nueva contrase�a debe tener al menos 6 caracteres');
      return;
    }

    try {
      await apiService.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      success('Contrase�a actualizada exitosamente');
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      error('Error al actualizar contrase�a');
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      // Guardar localmente
      localStorage.setItem(`user_preferences_${user.id}`, JSON.stringify(preferencesForm));
      
      // Enviar al servidor si hay endpoint
      await apiService.updateUserPreferences(user.id, preferencesForm);
      
      success('Preferencias guardadas exitosamente');
      setShowPreferencesModal(false);
      ai('Configuraci�n personalizada aplicada');
    } catch (err) {
      // Si falla el servidor, al menos se guard� localmente
      success('Preferencias guardadas localmente');
      setShowPreferencesModal(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('�Est� seguro que desea cerrar sesi�n?')) {
      logout();
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      [USER_ROLES.ADMIN]: 'Administrador',
      [USER_ROLES.SUPERVISOR]: 'Supervisor',
      [USER_ROLES.CAJERO]: 'Cajero'
    };
    return labels[role] || role;
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN: return 'destructive';
      case USER_ROLES.SUPERVISOR: return 'warning';
      default: return 'secondary';
    }
  };

  // M�tricas del usuario
  const userMetrics = [
    {
      title: 'Ventas del Mes',
      value: formatARS(userStats?.monthlySales || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: userStats?.salesChange || '+0%'
    },
    {
      title: 'Transacciones',
      value: userStats?.monthlyTransactions?.toString() || '0',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: userStats?.transactionsChange || '+0%'
    },
    {
      title: 'Promedio por Venta',
      value: formatARS(userStats?.averageTicket || 0),
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: userStats?.ticketChange || '+0%'
    },
    {
      title: 'Horas Trabajadas',
      value: `${userStats?.monthlyHours || 0}h`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: userStats?.hoursChange || '+0h'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando perfil de usuario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header del Perfil */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50" />
        <CardContent className="relative p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            
            {/* Avatar y Info b�sica */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    `${user?.nombre?.[0] || ''}${user?.apellido?.[0] || ''}`
                  )}
                </div>
                <Button 
                  size="sm" 
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full p-0"
                  onClick={() => setShowProfileModal(true)}
                >
                  <Camera className="w-3 h-3" />
                </Button>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.nombre} {user?.apellido}
                </h1>
                <p className="text-gray-600">@{user?.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getRoleBadgeVariant(user?.role)} size="sm">
                    {getRoleLabel(user?.role)}
                  </Badge>
                  {user?.isActive && (
                    <Badge variant="success" size="sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                      En l�nea
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones r�pidas */}
            <div className="flex-1 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPreferencesModal(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Preferencias
              </Button>
              <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                <Lock className="w-4 h-4 mr-2" />
                Cambiar Contrase�a
              </Button>
              <Button variant="outline" onClick={() => setShowProfileModal(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            </div>
          </div>

          {/* Info adicional */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{user?.telefono || 'No especificado'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{user?.sucursal || 'Principal'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Desde {formatDateTime(user?.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* M�tricas de Rendimiento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userMetrics.map((metric, index) => {
          const Icon = metric.icon;
          
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${metric.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                  <Badge variant="secondary" size="sm">
                    {metric.change}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{metric.title}</h3>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actividad y Rendimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {userActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'sale' ? 'bg-green-100 text-green-600' :
                    activity.type === 'login' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {activity.type === 'sale' ? (
                      <DollarSign className="w-4 h-4" />
                    ) : activity.type === 'login' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Activity className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDateTime(activity.timestamp)}</p>
                    {activity.amount && (
                      <p className="text-sm font-bold text-green-600 mt-1">
                        {formatARS(activity.amount)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gr�fico de Ventas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Ventas de los �ltimos 30 D�as
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={salesHistory}
              height={300}
              aiInsights={false}
            />
          </CardContent>
        </Card>
      </div>

      {/* Logros y Reconocimientos */}
      {userStats?.achievements && userStats.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Logros y Reconocimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userStats.achievements.map((achievement, index) => (
                <div key={index} className="p-4 border rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{achievement.title}</h3>
                      <p className="text-sm text-gray-600">{achievement.date}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{achievement.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendaciones Personalizadas de IA */}
      {personalizedRecommendations.length > 0 && (
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              Recomendaciones Personalizadas de IA
              <Badge variant="ai" size="sm">Para Ti</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalizedRecommendations.slice(0, 4).map((rec, index) => (
                <div key={index} className="p-4 bg-white/80 rounded-lg border border-emerald-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" size="sm">{rec.category}</Badge>
                        <span className="text-xs text-emerald-600 font-medium">
                          +{rec.potentialImpact}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights de Rendimiento */}
      {performanceInsights.length > 0 && (
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Análisis de Rendimiento IA
              <Badge variant="ai" size="sm">Insights</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceInsights.slice(0, 3).map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white/80 rounded-lg border border-blue-200">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{insight.metric}</h4>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${
                          insight.trend === 'up' ? 'text-green-600' : 
                          insight.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {insight.value}
                        </span>
                        <p className="text-xs text-gray-500">{insight.comparison}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{insight.analysis}</p>
                    {insight.recommendation && (
                      <p className="text-sm text-blue-700 mt-1 font-medium">
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Personalizados */}
      {personalizedTips.length > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/50 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-600" />
              Tips Personalizados
              <Badge variant="ai" size="sm">IA Tips</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalizedTips.slice(0, 6).map((tip, index) => (
                <div key={index} className="p-4 bg-white rounded-lg border border-orange-200">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 text-sm mb-1">{tip.title}</h5>
                      <p className="text-xs text-gray-600">{tip.description}</p>
                      {tip.priority && (
                        <Badge variant="outline" size="sm" className="mt-2">
                          {tip.priority} prioridad
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Editar Perfil */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Editar Perfil
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={profileForm.nombre}
                  onChange={(e) => setProfileForm({...profileForm, nombre: e.target.value})}
                  placeholder="Juan"
                />
              </div>
              <div>
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  value={profileForm.apellido}
                  onChange={(e) => setProfileForm({...profileForm, apellido: e.target.value})}
                  placeholder="P�rez"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                placeholder="juan.perez@empresa.com"
              />
            </div>

            <div>
              <Label htmlFor="telefono">Tel�fono</Label>
              <Input
                id="telefono"
                value={profileForm.telefono}
                onChange={(e) => setProfileForm({...profileForm, telefono: e.target.value})}
                placeholder="+54 11 1234-5678"
              />
            </div>

            <div>
              <Label htmlFor="sucursal">Sucursal</Label>
              <Input
                id="sucursal"
                value={profileForm.sucursal}
                onChange={(e) => setProfileForm({...profileForm, sucursal: e.target.value})}
                placeholder="Principal"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Contacte al administrador para cambiar sucursal</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfileModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleProfileUpdate} className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cambiar Contrase�a */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Cambiar Contrase�a
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Label htmlFor="currentPassword">Contrase�a Actual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  placeholder="********"
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="relative">
              <Label htmlFor="newPassword">Nueva Contrase�a</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  placeholder="********"
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="relative">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contrase�a</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  placeholder="********"
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Consejos de Seguridad</p>
                  <ul className="text-xs space-y-1">
                    <li>" Use al menos 6 caracteres</li>
                    <li>" Combine letras, n�meros y s�mbolos</li>
                    <li>" No use informaci�n personal</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePasswordUpdate} className="gap-2">
              <Lock className="w-4 h-4" />
              Cambiar Contrase�a
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Preferencias */}
      <Dialog open={showPreferencesModal} onOpenChange={setShowPreferencesModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Preferencias del Usuario
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            
            {/* Notificaciones */}
            <div>
              <Label className="text-base font-medium">Notificaciones</Label>
              <div className="space-y-3 mt-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailNotifications"
                    checked={preferencesForm.notifications.email}
                    onCheckedChange={(checked) => 
                      setPreferencesForm({
                        ...preferencesForm,
                        notifications: { ...preferencesForm.notifications, email: checked }
                      })
                    }
                  />
                  <Label htmlFor="emailNotifications" className="text-sm">Notificaciones por email</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lowStockAlerts"
                    checked={preferencesForm.notifications.lowStock}
                    onCheckedChange={(checked) => 
                      setPreferencesForm({
                        ...preferencesForm,
                        notifications: { ...preferencesForm.notifications, lowStock: checked }
                      })
                    }
                  />
                  <Label htmlFor="lowStockAlerts" className="text-sm">Alertas de stock bajo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dailyReports"
                    checked={preferencesForm.notifications.dailyReports}
                    onCheckedChange={(checked) => 
                      setPreferencesForm({
                        ...preferencesForm,
                        notifications: { ...preferencesForm.notifications, dailyReports: checked }
                      })
                    }
                  />
                  <Label htmlFor="dailyReports" className="text-sm">Reportes diarios</Label>
                </div>
              </div>
            </div>

            {/* Auto logout */}
            <div>
              <Label htmlFor="autoLogout">Cerrar sesi�n autom�tico (minutos)</Label>
              <Select 
                value={preferencesForm.autoLogout.toString()} 
                onChange={(value) => setPreferencesForm({...preferencesForm, autoLogout: parseInt(value)})}
                options={[
                  { value: "15", label: "15 minutos" },
                  { value: "30", label: "30 minutos" },
                  { value: "60", label: "1 hora" },
                  { value: "120", label: "2 horas" },
                  { value: "0", label: "Nunca" }
                ]}
                placeholder="Seleccionar tiempo"
              />
            </div>

            {/* Idioma */}
            <div>
              <Label htmlFor="language">Idioma</Label>
              <Select 
                value={preferencesForm.language} 
                onChange={(value) => setPreferencesForm({...preferencesForm, language: value})}
                options={[
                  { value: "es", label: "Español" },
                  { value: "en", label: "English" },
                  { value: "pt", label: "Português" }
                ]}
                placeholder="Seleccionar idioma"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreferencesModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePreferencesUpdate} className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Guardar Preferencias
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bot�n de Cerrar Sesi�n */}
      <div className="flex justify-center pt-6">
        <Button variant="outline" onClick={handleLogout} className="gap-2 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50">
          <LogOut className="w-4 h-4" />
          Cerrar Sesi�n
        </Button>
      </div>
    </div>
  );
};

export default Usuario;