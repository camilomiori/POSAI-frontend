import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Check, 
  X, 
  Trash2, 
  Filter,
  Zap,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';
import { Button, Badge } from '../ui';
import { useNotifications } from '../../hooks';
import { formatDateTime } from '../../utils/formatters';
import { NOTIFICATION_TYPES } from '../../utils/constants';

export const NotificationBell = ({ 
  className = '',
  showPreview = true,
  autoMarkAsRead = true,
  maxPreviewItems = 5
}) => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    clearNotifications,
    getNotificationsByType
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [animate, setAnimate] = useState(false);

  // Animar campana cuando lleguen nuevas notificaciones
  useEffect(() => {
    if (unreadCount > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Filtrar notificaciones
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : getNotificationsByType(filter);

  const recentNotifications = filteredNotifications.slice(0, maxPreviewItems);

  const handleNotificationClick = (notification) => {
    if (autoMarkAsRead && !notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    if (filteredNotifications.filter(n => !n.read).length === 0) {
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type) => {
    const iconProps = { className: "w-4 h-4 flex-shrink-0" };
    
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircle {...iconProps} className="w-4 h-4 text-green-500" />;
      case NOTIFICATION_TYPES.ERROR:
        return <X {...iconProps} className="w-4 h-4 text-red-500" />;
      case NOTIFICATION_TYPES.WARNING:
        return <AlertTriangle {...iconProps} className="w-4 h-4 text-yellow-500" />;
      case NOTIFICATION_TYPES.AI:
        return <Zap {...iconProps} className="w-4 h-4 text-emerald-500" />;
      default:
        return <Info {...iconProps} className="w-4 h-4 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (type, isRead) => {
    if (isRead) return 'bg-white';
    
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'bg-green-50/80';
      case NOTIFICATION_TYPES.ERROR:
        return 'bg-red-50/80';
      case NOTIFICATION_TYPES.WARNING:
        return 'bg-yellow-50/80';
      case NOTIFICATION_TYPES.AI:
        return 'bg-emerald-50/80';
      default:
        return 'bg-blue-50/80';
    }
  };

  const filterOptions = [
    { value: 'all', label: 'Todas', count: notifications.length },
    { value: NOTIFICATION_TYPES.AI, label: 'IA', count: getNotificationsByType(NOTIFICATION_TYPES.AI).length },
    { value: NOTIFICATION_TYPES.SUCCESS, label: 'Exitosas', count: getNotificationsByType(NOTIFICATION_TYPES.SUCCESS).length },
    { value: NOTIFICATION_TYPES.WARNING, label: 'Alertas', count: getNotificationsByType(NOTIFICATION_TYPES.WARNING).length },
    { value: NOTIFICATION_TYPES.ERROR, label: 'Errores', count: getNotificationsByType(NOTIFICATION_TYPES.ERROR).length }
  ].filter(option => option.count > 0);

  return (
    <div className={`relative ${className}`}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative transition-all duration-300 ${
          animate ? 'animate-bounce' : ''
        } ${unreadCount > 0 ? 'text-blue-600' : 'text-gray-600'}`}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-neutral-200/50 z-50 max-h-[32rem] flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200/50">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" size="sm">
                  {unreadCount} nuevas
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Marcar todas
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          {filterOptions.length > 1 && (
            <div className="flex items-center gap-2 p-3 border-b border-neutral-100">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex gap-1 overflow-x-auto">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      filter === option.value
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                    {option.count > 0 && (
                      <span className="ml-1 text-xs opacity-75">({option.count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <Bell className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">No hay notificaciones</p>
                <p className="text-xs text-center mt-1">
                  {filter === 'all' 
                    ? 'Cuando tengas notificaciones aparecerán aquí' 
                    : `No hay notificaciones de tipo "${filterOptions.find(f => f.value === filter)?.label}"`
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {(showPreview ? recentNotifications : filteredNotifications).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-all duration-200 hover:bg-neutral-50 cursor-pointer relative ${
                      getNotificationBgColor(notification.type, notification.read)
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium text-gray-900 ${
                            !notification.read ? 'font-semibold' : ''
                          }`}>
                            {notification.title}
                          </p>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 rounded hover:bg-blue-100 text-blue-600"
                                title="Marcar como leída"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="p-1 rounded hover:bg-red-100 text-red-600"
                              title="Eliminar notificación"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Message */}
                        {notification.message && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">
                            {formatDateTime(notification.timestamp)}
                          </p>
                          
                          {/* Type Badge */}
                          <Badge 
                            variant={notification.type === NOTIFICATION_TYPES.AI ? 'ai' : 'secondary'}
                            size="sm"
                            className="text-xs"
                          >
                            {notification.type === NOTIFICATION_TYPES.AI && (
                              <Zap className="w-3 h-3 mr-1" />
                            )}
                            {notification.type}
                          </Badge>
                        </div>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="flex items-center justify-between p-3 border-t border-neutral-200/50 bg-gray-50/50">
              <div className="flex items-center gap-2">
                {showPreview && filteredNotifications.length > maxPreviewItems && (
                  <p className="text-xs text-gray-500">
                    Mostrando {maxPreviewItems} de {filteredNotifications.length}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('¿Está seguro que desea eliminar todas las notificaciones?')) {
                        clearNotifications();
                        setIsOpen(false);
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Limpiar
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-xs"
                >
                  Ver todas
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click Outside Handler */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};