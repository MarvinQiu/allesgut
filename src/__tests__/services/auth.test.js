import { authService } from '../../services/auth';

// Mock the api module
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
  setAuthToken: jest.fn(),
  clearAuthToken: jest.fn(),
}));

import api, { setAuthToken, clearAuthToken } from '../../services/api';

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('sendSmsCode', () => {
    test('calls correct endpoint with phone number', async () => {
      api.post.mockResolvedValue({ data: { success: true } });

      await authService.sendSmsCode('13800138000');

      expect(api.post).toHaveBeenCalledWith('/auth/sms/send', {
        phone: '13800138000'
      });
    });
  });

  describe('verifySmsCode', () => {
    test('stores token and user on successful verification', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'jwt-token-123',
            user: { id: 1, nickname: 'Test User' }
          }
        }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await authService.verifySmsCode('13800138000', '123456');

      expect(api.post).toHaveBeenCalledWith('/auth/sms/verify', {
        phone: '13800138000',
        code: '123456'
      });
      expect(setAuthToken).toHaveBeenCalledWith('jwt-token-123');
      expect(localStorage.getItem('auth_token')).toBe('jwt-token-123');
      expect(result.user).toEqual({ id: 1, nickname: 'Test User' });
    });
  });

  describe('logout', () => {
    test('clears token and localStorage', async () => {
      localStorage.setItem('auth_token', 'old-token');
      api.post.mockResolvedValue({ data: { success: true } });

      await authService.logout();

      expect(clearAuthToken).toHaveBeenCalled();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('restoreSession', () => {
    test('restores token from localStorage if exists', async () => {
      localStorage.setItem('auth_token', 'stored-token');
      api.get.mockResolvedValue({
        data: { success: true, data: { id: 1, nickname: 'User' } }
      });

      const user = await authService.restoreSession();

      expect(setAuthToken).toHaveBeenCalledWith('stored-token');
      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(user).toEqual({ id: 1, nickname: 'User' });
    });

    test('returns null if no stored token', async () => {
      const user = await authService.restoreSession();
      expect(user).toBeNull();
    });
  });
});
