import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsService } from '../../services/notifications';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const result = await notificationsService.getNotifications();
      setNotifications(result.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return 'fas fa-heart text-red-500';
      case 'comment': return 'fas fa-comment text-blue-500';
      case 'follow': return 'fas fa-user-plus text-green-500';
      case 'mention': return 'fas fa-at text-purple-500';
      case 'new_post': return 'fas fa-file-alt text-primary-500';
      default: return 'fas fa-bell text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <span className="font-medium text-gray-900">通知</span>
          <button
            onClick={handleMarkAllAsRead}
            className="text-primary-500 text-sm font-medium"
          >
            全部已读
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
        </div>
      )}

      {/* Notifications list */}
      {!loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <i className="fas fa-bell-slash text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">暂无通知</p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="divide-y divide-gray-100">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleMarkAsRead(notification.id)}
              className={`p-4 flex items-start space-x-3 ${
                !notification.is_read ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <i className={getNotificationIcon(notification.type)}></i>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 text-sm">
                  {notification.content || notification.message}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {notification.created_at || notification.time}
                </p>
              </div>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
