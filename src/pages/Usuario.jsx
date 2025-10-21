import React, { useState, useEffect } from 'react';
import {
  User, Edit, Camera, Settings, Shield, Bell, Eye, Download,
  Star, Activity, Clock, TrendingUp, BarChart3, Zap, Heart,
  Award, Target, Calendar, Smartphone, Mail, Lock, Globe,
  Palette, Moon, Sun, Volume2, VolumeX, Save, RefreshCw
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Label,
  Dialog, DialogContent, DialogHeader, DialogTitle, Switch, Select
} from '../components/ui';
import { useAuth } from '../hooks';
import useToast from '../hooks/useToast';
import useNotifications from '../hooks/useNotifications';
import apiService from '../services/api';

const Usuario = () => {
  const { user, updateUserProfile, logout } = useAuth();
  const { success, error, warning, ai } = useToast();
  const { addNotification } = useNotifications();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    avatar: user?.avatar || ''
  });

  const [preferences, setPreferences] = useState({
    theme: 'light',
    notifications: true,
    emailAlerts: true,
    soundEnabled: true,
    language: 'es',
    timezone: 'America/Argentina/Buenos_Aires'
  });

  const [userStats, setUserStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    avgSessionTime: '4h 32m',
    productsSold: 0,
    customersSaved: 0,
    lastLogin: new Date().toISOString()
  });

  const [recentActivity, setRecentActivity] = useState([]);

  // Limitar actividades mostradas en la vista principal
  const ACTIVITIES_LIMIT = 5;
  const displayedActivities = recentActivity.slice(0, ACTIVITIES_LIMIT);
  const hasMoreActivities = recentActivity.length > ACTIVITIES_LIMIT;

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'supervisor': return 'default';
      case 'cajero': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      cajero: 'Cajero',
      demo: 'Demo'
    };
    return labels[role] || role;
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (!user?.id) return;

    const loadUserData = async () => {
      try {
        setLoading(true);

        // Cargar estadísticas
        const statsData = await apiService.getUserStats(user.id);
        if (statsData?.data) {
          setUserStats(prev => ({
            ...prev,
            totalSales: statsData.data.totalSales || 0,
            totalRevenue: statsData.data.totalRevenue || 0,
            avgSessionTime: statsData.data.avgSessionTime || '4h 32m',
            productsSold: statsData.data.productsSold || 0,
            customersSaved: statsData.data.customersSaved || 0,
            lastLogin: statsData.data.lastLogin || new Date().toISOString()
          }));
        }

        // Cargar actividad reciente
        const activityData = await apiService.getUserActivity(user.id);
        if (activityData?.data) {
          setRecentActivity(Array.isArray(activityData.data) ? activityData.data : []);
        }

        // Cargar preferencias
        const preferencesData = await apiService.getUserPreferences(user.id);
        if (preferencesData) {
          setPreferences(preferencesData);
        }

      } catch (err) {
        console.error('Error cargando datos de usuario:', err);
        warning('⚠️ Error al cargar datos, mostrando datos por defecto');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user?.id]);

  // Actualizar profileForm cuando cambia el usuario
  useEffect(() => {
    if (user) {
      setProfileForm({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        telefono: user.telefono || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  // Aplicar tema cuando cambian las preferencias
  useEffect(() => {
    const applyTheme = () => {
      const html = document.documentElement;

      // Remover clases anteriores
      html.classList.remove('light', 'dark');

      // Aplicar nuevo tema
      if (preferences.theme === 'dark') {
        html.classList.add('dark');
        document.body.style.backgroundColor = '#0f172a';
      } else if (preferences.theme === 'light') {
        html.classList.add('light');
        document.body.style.backgroundColor = '#ffffff';
      } else if (preferences.theme === 'auto') {
        // Detectar preferencia del sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.classList.add(prefersDark ? 'dark' : 'light');
        document.body.style.backgroundColor = prefersDark ? '#0f172a' : '#ffffff';
      }

      // Guardar en localStorage
      localStorage.setItem(`userPreferences_${user?.id}`, JSON.stringify(preferences));
    };

    applyTheme();
  }, [preferences.theme, user?.id]);

  // Manejar notificaciones
  useEffect(() => {
    if (preferences.notifications) {
      localStorage.setItem(`notificationsEnabled_${user?.id}`, 'true');
    } else {
      localStorage.setItem(`notificationsEnabled_${user?.id}`, 'false');
    }
  }, [preferences.notifications, user?.id]);

  // Manejar sonidos
  useEffect(() => {
    if (preferences.soundEnabled) {
      localStorage.setItem(`soundEnabled_${user?.id}`, 'true');
    } else {
      localStorage.setItem(`soundEnabled_${user?.id}`, 'false');
    }
  }, [preferences.soundEnabled, user?.id]);

  const formatARS = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(profileForm);
      success('✅ Perfil actualizado exitosamente');
      setShowProfileModal(false);
    } catch (err) {
      error('❌ Error al actualizar perfil');
    }
  };

  const handleSavePreferences = async () => {
    try {
      // Reproducir sonido de confirmación si está habilitado
      if (preferences.soundEnabled) {
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();

          oscillator.connect(gain);
          gain.connect(audioContext.destination);

          oscillator.frequency.value = 800;
          oscillator.type = 'sine';

          gain.gain.setValueAtTime(0.3, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
          console.log('No audio API available');
        }
      }

      // Guardar preferencias en el backend
      await apiService.updateUserPreferences(user.id, preferences);

      success('⚙️ Preferencias guardadas exitosamente');
      ai('🤖 IA adaptando configuración', 'Sistema optimizado según tus preferencias');

      // Mostrar resumen de cambios
      const changes = [];
      if (preferences.theme) changes.push(`Tema: ${preferences.theme}`);
      if (preferences.language) changes.push(`Idioma: ${preferences.language === 'es' ? 'Español' : 'English'}`);
      if (preferences.timezone) changes.push(`Zona: ${preferences.timezone.split('/')[1]}`);

      if (changes.length > 0) {
        addNotification({
          type: 'success',
          message: `Cambios aplicados: ${changes.join(', ')}`
        });
      }

      setShowPreferencesModal(false);
    } catch (err) {
      error('❌ Error al guardar preferencias');
      warning('⚠️ Las preferencias se guardarán localmente');
      // Las preferencias se guardarán localmente como fallback (por los useEffect)
    }
  };

  const exportUserData = () => {
    const userData = {
      profile: user,
      stats: userStats,
      activity: recentActivity,
      preferences,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuario-${user?.username}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success('📄 Datos exportados exitosamente');
  };

  const statsCards = [
    {
      title: 'Ventas Realizadas',
      value: userStats.totalSales,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Revenue Generado',
      value: formatARS(userStats.totalRevenue),
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Productos Vendidos',
      value: userStats.productsSold,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Tiempo Promedio',
      value: userStats.avgSessionTime,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: 'Estable',
      changeType: 'neutral'
    }
  ];

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{!user ? 'Cargando perfil...' : 'Cargando datos de usuario...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg">
              <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                Usuario
              </h1>
              <p className="text-base sm:text-lg text-gray-500 font-medium">Gestión de perfil y configuración personal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreferencesModal(true)}
              className="gap-2 border-gray-200 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
              Preferencias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportUserData}
              className="gap-2 border-gray-200 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Profile Header */}
        <Card className="border-l-4 border-l-blue-500 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    `${user?.nombre?.[0] || ''}${user?.apellido?.[0] || ''}`
                  )}
                </div>
                <Button
                  size="sm"
                  className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full p-0 shadow-lg"
                  onClick={() => setShowProfileModal(true)}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                      {user?.nombre} {user?.apellido}
                    </h2>
                    <p className="text-gray-600 text-lg mb-2">@{user?.username}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant={getRoleBadgeVariant(user?.role)} size="sm">
                        {getRoleLabel(user?.role)}
                      </Badge>
                      {user?.isActive && (
                        <Badge variant="outline" size="sm" className="text-green-600 border-green-200">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Activo
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">
                        Último acceso: {formatDateTime(userStats.lastLogin)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowProfileModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar Perfil
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <div className={`text-sm mt-1 ${
                      stat.changeType === 'positive' ? 'text-green-600' :
                      stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stat.change}
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Activity */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayedActivities.length > 0 ? (
                <>
                  {displayedActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'sale' ? 'bg-green-100' :
                        activity.type === 'product' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {activity.type === 'sale' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : activity.type === 'product' ? (
                          <Zap className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-600" />
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

                  {hasMoreActivities && (
                    <Button
                      variant="outline"
                      onClick={() => setShowActivityModal(true)}
                      className="w-full mt-4 border-gray-200 hover:bg-green-50 hover:border-green-300 text-green-600 font-medium gap-2"
                    >
                      Ver todas las actividades ({recentActivity.length})
                      <Activity className="w-4 h-4" />
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hay actividades aún</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-200"
                  onClick={() => setShowProfileModal(true)}
                >
                  <Edit className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Editar Perfil</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 hover:bg-green-50 hover:border-green-200"
                  onClick={() => setShowPreferencesModal(true)}
                >
                  <Settings className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Configurar</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 hover:bg-orange-50 hover:border-orange-200"
                  onClick={exportUserData}
                >
                  <Download className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium">Exportar</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 hover:bg-red-50 hover:border-red-200"
                  onClick={() => {
                    warning('⚠️ Sesión cerrada');
                    logout();
                  }}
                >
                  <Shield className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium">Cerrar Sesión</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Edit Modal */}
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
                    onChange={(e) => setProfileForm(prev => ({ ...prev, nombre: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    value={profileForm.apellido}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, apellido: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={profileForm.telefono}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, telefono: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preferences Modal */}
        <Dialog open={showPreferencesModal} onOpenChange={setShowPreferencesModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Preferencias del Usuario
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Theme */}
              <div>
                <Label className="text-base font-medium mb-3 flex items-center gap-2">
                  {preferences.theme === 'dark' ? (
                    <Moon className="w-4 h-4" />
                  ) : preferences.theme === 'light' ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  Tema: <span className="text-green-600 font-semibold">{
                    preferences.theme === 'dark' ? 'Oscuro' :
                    preferences.theme === 'light' ? 'Claro' : 'Automático'
                  }</span>
                </Label>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { value: 'light', label: 'Claro', icon: Sun, bg: 'bg-white border-yellow-400' },
                    { value: 'dark', label: 'Oscuro', icon: Moon, bg: 'bg-slate-900 border-blue-400' },
                    { value: 'auto', label: 'Auto', icon: Globe, bg: 'bg-gradient-to-r from-white to-slate-900 border-purple-400' }
                  ].map(option => (
                    <Button
                      key={option.value}
                      onClick={() => setPreferences(prev => ({ ...prev, theme: option.value }))}
                      variant={preferences.theme === option.value ? 'default' : 'outline'}
                      className={`flex flex-col gap-2 h-24 border-2 ${
                        preferences.theme === option.value
                          ? 'border-green-500 bg-green-50'
                          : option.bg
                      }`}
                    >
                      <option.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div>
                <Label className="text-base font-medium">Notificaciones</Label>
                <div className="space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Notificaciones push</span>
                    </div>
                    <Switch
                      checked={preferences.notifications}
                      onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, notifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Alertas por email</span>
                    </div>
                    <Switch
                      checked={preferences.emailAlerts}
                      onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailAlerts: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Sonidos</span>
                    </div>
                    <Switch
                      checked={preferences.soundEnabled}
                      onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, soundEnabled: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Language & Region */}
              <div>
                <Label className="text-base font-medium">Idioma y Región</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label className="text-sm text-gray-600">Idioma</Label>
                    <Select
                      value={preferences.language}
                      onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Zona Horaria</Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}
                    >
                      <option value="America/Argentina/Buenos_Aires">Buenos Aires</option>
                      <option value="America/Argentina/Cordoba">Córdoba</option>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Preferencias
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPreferencesModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Activity Modal */}
        <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Todas las Actividades ({recentActivity.length})
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all">
                    <div className={`p-3 rounded-lg flex-shrink-0 ${
                      activity.type === 'sale' ? 'bg-green-100' :
                      activity.type === 'product' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {activity.type === 'sale' ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : activity.type === 'product' ? (
                        <Zap className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDateTime(activity.timestamp)}</p>
                        </div>
                        {activity.amount && (
                          <Badge variant="outline" className="flex-shrink-0 bg-green-50 border-green-200 text-green-700 font-semibold">
                            {formatARS(activity.amount)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No hay actividades para mostrar</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowActivityModal(false)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default Usuario;