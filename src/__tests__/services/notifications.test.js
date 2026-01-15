import { notificationsService } from '../../services/notifications';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

import api from '../../services/api';

describe('Notifications Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    test('fetches notifications with pagination', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { notifications: [], total: 0 } }
      });

      await notificationsService.getNotifications();

      expect(api.get).toHaveBeenCalledWith('/notifications', {
        params: { page: 1, limit: 20 }
      });
    });
  });

  describe('getUnreadCount', () => {
    test('fetches unread count', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { count: 5 } }
      });

      const result = await notificationsService.getUnreadCount();

      expect(api.get).toHaveBeenCalledWith('/notifications/unread-count');
      expect(result).toBe(5);
    });
  });

  describe('markAsRead', () => {
    test('marks single notification as read', async () => {
      api.put.mockResolvedValue({ data: { success: true } });

      await notificationsService.markAsRead(1);

      expect(api.put).toHaveBeenCalledWith('/notifications/1/read');
    });
  });

  describe('markAllAsRead', () => {
    test('marks all notifications as read', async () => {
      api.put.mockResolvedValue({ data: { success: true } });

      await notificationsService.markAllAsRead();

      expect(api.put).toHaveBeenCalledWith('/notifications/read-all');
    });
  });
});
