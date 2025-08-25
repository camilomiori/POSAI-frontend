// hooks/useNotifications.js
import { useState, useCallback, useEffect } from 'react';
import { NOTIFICATION_TYPES, STORAGE_KEYS } from '../utils/constants';

const useNotifications = () => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage when notifications change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (error) {
      console.warn('Failed to save notifications to localStorage:', error);
    }
  }, [notifications]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      read: false,
      type: NOTIFICATION_TYPES.INFO,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    return newNotification.id;
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearReadNotifications = useCallback(() => {
    setNotifications(prev => prev.filter(notification => !notification.read));
  }, []);

  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  // Computed values
  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;
  const hasUnread = unreadCount > 0;

  // Convenience methods for adding different types of notifications
  const addSuccess = useCallback((title, message) => {
    return addNotification({
      title,
      message,
      type: NOTIFICATION_TYPES.SUCCESS
    });
  }, [addNotification]);

  const addError = useCallback((title, message) => {
    return addNotification({
      title,
      message,
      type: NOTIFICATION_TYPES.ERROR
    });
  }, [addNotification]);

  const addWarning = useCallback((title, message) => {
    return addNotification({
      title,
      message,
      type: NOTIFICATION_TYPES.WARNING
    });
  }, [addNotification]);

  const addInfo = useCallback((title, message) => {
    return addNotification({
      title,
      message,
      type: NOTIFICATION_TYPES.INFO
    });
  }, [addNotification]);

  const addAI = useCallback((title, message) => {
    return addNotification({
      title,
      message,
      type: NOTIFICATION_TYPES.AI
    });
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    totalCount,
    hasUnread,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
    clearReadNotifications,
    getNotificationsByType,
    addSuccess,
    addError,
    addWarning,
    addInfo,
    addAI
  };
};

export default useNotifications;