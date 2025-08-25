import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Settings,
  Activity,
  DollarSign,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  Download,
  Upload,
  Database,
  Server,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  FileText,
  Lock,
  Unlock,
  RefreshCw,
  CheckCircle,
  XCircle,
  UserX,
  Mail,
  Phone,
  MapPin,
  Star,
  Zap
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Checkbox,
  Label,
  Textarea
} from '../components/ui';
import { BarChart, PieChart as PieChartComponent, LineChart } from '../components/charts';
import { useAuth, useToast, useDebounce } from '../hooks';
import { apiService } from '../services';
import { formatARS, formatDateTime, formatPercentage } from '../utils/formatters';
import { USER_ROLES, PERMISSIONS } from '../utils/constants';

const Administracion = () => {
  const { user, hasPermission, isAdmin } = useAuth();
  const { success, error, warning, ai } = useToast();

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [businessAnalytics, setBusinessAnalytics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Estados para modales
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form data para usuario
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    email: '',
    nombre: '',
    apellido: '',
    telefono: '',
    role: USER_ROLES.CAJERO,
    permissions: [],
    sucursal: '',
    turno: 'morning',
    activo: true
  });

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Cargar datos
  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  // Filtrar cuando cambia la b�squeda
  useEffect(() => {
    if (debouncedSearch) {
      searchUsers();
    } else {
      loadUsers();
    }
  }, [debouncedSearch, selectedRole, selectedStatus]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [usersResponse, statsResponse, logsResponse, analyticsResponse] = await Promise.all([
        apiService.getUsers(),
        apiService.getSystemStats(),
        apiService.getAuditLogs({ limit: 50 }),
        apiService.getBusinessAnalytics()
      ]);

      setUsers(usersResponse.data || []);
      setSystemStats(statsResponse);
      setAuditLogs(logsResponse.data || []);
      setBusinessAnalytics(analyticsResponse);
      
    } catch (err) {
      error('Error al cargar datos administrativos');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiService.getUsers({
        role: selectedRole !== 'all' ? selectedRole : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      });
      setUsers(response.data || []);
    } catch (err) {
      error('Error al cargar usuarios');
    }
  };

  const searchUsers = async () => {
    try {
      const response = await apiService.getUsers({
        search: debouncedSearch,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      });
      setUsers(response.data || []);
    } catch (err) {
      error('Error en la b�squeda de usuarios');
    }
  };

  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !debouncedSearch || 
        user.nombre.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.apellido.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.username.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'active' ? user.activo : !user.activo);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, debouncedSearch, selectedRole, selectedStatus]);

  // CRUD de usuarios
  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      password: '',
      email: '',
      nombre: '',
      apellido: '',
      telefono: '',
      role: USER_ROLES.CAJERO,
      permissions: [],
      sucursal: '',
      turno: 'morning',
      activo: true
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username || '',
      password: '',
      email: user.email || '',
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      telefono: user.telefono || '',
      role: user.role || USER_ROLES.CAJERO,
      permissions: user.permissions || [],
      sucursal: user.sucursal || '',
      turno: user.turno || 'morning',
      activo: user.activo !== false
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      const userData = {
        ...userForm,
        permissions: userForm.permissions
      };

      if (editingUser) {
        await apiService.updateUser(editingUser.id, userData);
        success('Usuario actualizado exitosamente');
      } else {
        await apiService.createUser(userData);
        success('Usuario creado exitosamente');
      }

      setShowUserModal(false);
      loadUsers();
    } catch (err) {
      error('Error al guardar usuario');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await apiService.updateUser(userId, { activo: !currentStatus });
      success(currentStatus ? 'Usuario desactivado' : 'Usuario activado');
      loadUsers();
    } catch (err) {
      error('Error al cambiar estado del usuario');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('�Est� seguro que desea eliminar este usuario?')) return;

    try {
      await apiService.deleteUser(userId);
      success('Usuario eliminado exitosamente');
      loadUsers();
    } catch (err) {
      error('Error al eliminar usuario');
    }
  };

  const handlePermissionChange = (permission, checked) => {
    setUserForm(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
  };

  // M�tricas del sistema
  const systemMetrics = useMemo(() => {
    if (!systemStats) return [];

    return [
      {
        title: 'Usuarios Activos',
        value: systemStats.activeUsers?.toString() || '0',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        change: '+5.2%'
      },
      {
        title: 'Ventas del D�a',
        value: formatARS.format(systemStats.dailySales || 0),
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        change: '+12.3%'
      },
      {
        title: 'Transacciones',
        value: systemStats.dailyTransactions?.toString() || '0',
        icon: Activity,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        change: '+8.7%'
      },
      {
        title: 'Alertas Activas',
        value: systemStats.activeAlerts?.toString() || '0',
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        change: '-2'
      }
    ];
  }, [systemStats]);

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

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tiene permisos para acceder a esta secci�n.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando panel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administraci�n</h1>
          <p className="text-gray-600 mt-1">
            Gesti�n de usuarios, sistema y analytics del negocio
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowLogsModal(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Logs del Sistema
          </Button>
          <Button variant="outline" onClick={() => setShowSystemModal(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Configuraci�n
          </Button>
          <Button onClick={handleCreateUser} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* M�tricas del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemMetrics.map((metric, index) => {
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

      {/* Gesti�n de Usuarios */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gesti�n de Usuarios
              <Badge variant="secondary" size="sm">
                {filteredUsers.length} usuarios
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar usuarios por nombre, usuario o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value={USER_ROLES.ADMIN}>Administrador</SelectItem>
                <SelectItem value={USER_ROLES.SUPERVISOR}>Supervisor</SelectItem>
                <SelectItem value={USER_ROLES.CAJERO}>Cajero</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => loadUsers()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Lista de usuarios */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Usuario</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Rol</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">�ltimo Acceso</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Sucursal</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                          user.activo ? 'bg-blue-600' : 'bg-gray-400'
                        }`}>
                          {user.nombre?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.nombre} {user.apellido}
                          </p>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                        {getRoleLabel(user.role)}
                      </Badge>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={`text-sm ${user.activo ? 'text-green-700' : 'text-red-700'}`}>
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {user.lastLogin ? formatDateTime(user.lastLogin) : 'Nunca'}
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{user.sucursal || 'Principal'}</span>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleUserStatus(user.id, user.activo)}
                        >
                          {user.activo ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </Button>
                        
                        {user.id !== user.id && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Analytics del Negocio */}
      {businessAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Ventas por Usuario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={businessAnalytics.salesByUser || []}
                height={300}
                aiRanking={true}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Distribuci�n de Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PieChartComponent
                data={businessAnalytics.roleDistribution || []}
                height={300}
                showPercentages={true}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Usuario */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={userForm.nombre}
                  onChange={(e) => setUserForm({...userForm, nombre: e.target.value})}
                  placeholder="Juan"
                />
              </div>

              <div>
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={userForm.apellido}
                  onChange={(e) => setUserForm({...userForm, apellido: e.target.value})}
                  placeholder="P�rez"
                />
              </div>

              <div>
                <Label htmlFor="username">Usuario *</Label>
                <Input
                  id="username"
                  value={userForm.username}
                  onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  placeholder="jperez"
                />
              </div>

              <div>
                <Label htmlFor="password">
                  {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  placeholder="********"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  placeholder="juan.perez@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="telefono">Tel�fono</Label>
                <Input
                  id="telefono"
                  value={userForm.telefono}
                  onChange={(e) => setUserForm({...userForm, telefono: e.target.value})}
                  placeholder="+54 11 1234-5678"
                />
              </div>

              <div>
                <Label htmlFor="role">Rol *</Label>
                <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={USER_ROLES.CAJERO}>Cajero</SelectItem>
                    <SelectItem value={USER_ROLES.SUPERVISOR}>Supervisor</SelectItem>
                    <SelectItem value={USER_ROLES.ADMIN}>Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sucursal">Sucursal</Label>
                <Input
                  id="sucursal"
                  value={userForm.sucursal}
                  onChange={(e) => setUserForm({...userForm, sucursal: e.target.value})}
                  placeholder="Principal"
                />
              </div>

              <div>
                <Label htmlFor="turno">Turno</Label>
                <Select value={userForm.turno} onValueChange={(value) => setUserForm({...userForm, turno: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Ma�ana</SelectItem>
                    <SelectItem value="afternoon">Tarde</SelectItem>
                    <SelectItem value="night">Noche</SelectItem>
                    <SelectItem value="full">Completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="activo"
                  checked={userForm.activo}
                  onCheckedChange={(checked) => setUserForm({...userForm, activo: checked})}
                />
                <Label htmlFor="activo">Usuario activo</Label>
              </div>
            </div>

            {/* Permisos */}
            <div className="md:col-span-2">
              <Label className="text-base font-medium">Permisos Especiales</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {Object.values(PERMISSIONS).map(permission => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission}
                      checked={userForm.permissions.includes(permission)}
                      onCheckedChange={(checked) => handlePermissionChange(permission, checked)}
                    />
                    <Label htmlFor={permission} className="text-sm">
                      {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} className="gap-2">
              <CheckCircle className="w-4 h-4" />
              {editingUser ? 'Actualizar' : 'Crear'} Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Logs */}
      <Dialog open={showLogsModal} onOpenChange={setShowLogsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Logs de Auditor�a del Sistema
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {auditLogs.map((log, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={log.level === 'error' ? 'destructive' : 
                               log.level === 'warning' ? 'warning' : 'secondary'}
                      size="sm"
                    >
                      {log.level}
                    </Badge>
                    <span className="font-medium text-gray-900">{log.action}</span>
                  </div>
                  <span className="text-sm text-gray-500">{formatDateTime(log.timestamp)}</span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{log.message}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Usuario: {log.user}</span>
                  <span>IP: {log.ipAddress}</span>
                  {log.module && <span>M�dulo: {log.module}</span>}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogsModal(false)}>
              Cerrar
            </Button>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Exportar Logs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Configuraci�n del Sistema */}
      <Dialog open={showSystemModal} onOpenChange={setShowSystemModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuraci�n del Sistema
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Base de Datos</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Estado: <span className="text-green-600 font-medium">Conectada</span></p>
                    <p>Conexiones: 12/100</p>
                    <p>�ltimo backup: Ayer 02:00</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Server className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Servidor</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>CPU: <span className="font-medium">45%</span></p>
                    <p>Memoria: <span className="font-medium">62%</span></p>
                    <p>Disco: <span className="font-medium">78%</span></p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Button variant="outline" className="w-full gap-2">
                <Download className="w-4 h-4" />
                Crear Backup Manual
              </Button>
              
              <Button variant="outline" className="w-full gap-2">
                <RefreshCw className="w-4 h-4" />
                Reiniciar Servicios
              </Button>
              
              <Button variant="destructive" className="w-full gap-2">
                <AlertTriangle className="w-4 h-4" />
                Modo Mantenimiento
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSystemModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Administracion;