import { usersService } from '../../services/users';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '../../services/api';

describe('Users Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    test('fetches user by id', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { id: 1, nickname: 'Test' } }
      });

      const result = await usersService.getUser(1);

      expect(api.get).toHaveBeenCalledWith('/users/1');
      expect(result).toEqual({ id: 1, nickname: 'Test' });
    });
  });

  describe('updateProfile', () => {
    test('updates current user profile', async () => {
      api.put.mockResolvedValue({
        data: { success: true, data: { id: 1, nickname: 'Updated' } }
      });

      await usersService.updateProfile({ nickname: 'Updated' });

      expect(api.put).toHaveBeenCalledWith('/users/me', { nickname: 'Updated' });
    });
  });

  describe('followUser', () => {
    test('follows a user', async () => {
      api.post.mockResolvedValue({ data: { success: true } });

      await usersService.followUser(2);

      expect(api.post).toHaveBeenCalledWith('/users/2/follow');
    });
  });

  describe('unfollowUser', () => {
    test('unfollows a user', async () => {
      api.delete.mockResolvedValue({ data: { success: true } });

      await usersService.unfollowUser(2);

      expect(api.delete).toHaveBeenCalledWith('/users/2/follow');
    });
  });

  describe('getUserPosts', () => {
    test('fetches posts by user', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { posts: [], total: 0 } }
      });

      await usersService.getUserPosts(1);

      expect(api.get).toHaveBeenCalledWith('/users/1/posts', {
        params: { page: 1, limit: 20 }
      });
    });
  });
});
