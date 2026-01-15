import api, { setAuthToken, clearAuthToken } from './api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const authService = {
  async sendSmsCode(phone) {
    const response = await api.post('/auth/sms/send', { phone });
    return response.data;
  },

  async verifySmsCode(phone, code) {
    const response = await api.post('/auth/sms/verify', { phone, code });

    if (response.data.success) {
      const { token, user } = response.data.data;

      // Store token
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setAuthToken(token);

      return { token, user };
    }

    throw new Error(response.data.message || 'Verification failed');
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout API errors
      console.warn('Logout API error:', error);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      clearAuthToken();
    }
  },

  async restoreSession() {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      return null;
    }

    try {
      setAuthToken(token);
      const response = await api.get('/auth/me');

      if (response.data.success) {
        const user = response.data.data;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
      }

      throw new Error('Invalid session');
    } catch (error) {
      // Token invalid or expired
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      clearAuthToken();
      return null;
    }
  },

  getStoredUser() {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};
