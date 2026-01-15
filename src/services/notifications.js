import api from './api';

export const notificationsService = {
  async getNotifications({ page = 1, limit = 20 } = {}) {
    const response = await api.get('/notifications', {
      params: { page, limit }
    });
    return response.data.data;
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data.data.count;
  },

  async markAsRead(id) {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};
