import api, { setAuthToken, clearAuthToken } from '../../services/api';

describe('API Service', () => {
  beforeEach(() => {
    clearAuthToken();
  });

  test('api has correct base URL', () => {
    expect(api.defaults.baseURL).toBe('https://api.allesgut.com/v1');
  });

  test('setAuthToken adds Authorization header', () => {
    setAuthToken('test-token-123');
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer test-token-123');
  });

  test('clearAuthToken removes Authorization header', () => {
    setAuthToken('test-token-123');
    clearAuthToken();
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
  });
});
