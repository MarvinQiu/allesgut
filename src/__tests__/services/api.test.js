import api, { setAuthToken, clearAuthToken } from '../../services/api';

describe('API Service', () => {
  beforeEach(() => {
    clearAuthToken();
  });

  test('api has correct base URL (default fallback)', () => {
    // When REACT_APP_API_BASE_URL is not set, falls back to default
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

  test('401 response dispatches auth:unauthorized event', async () => {
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    // Find the response error interceptor and invoke it directly
    const interceptors = api.interceptors.response.handlers;
    const errorHandler = interceptors.find(h => h && h.rejected)?.rejected;

    expect(errorHandler).toBeDefined();

    const mockError = {
      response: { status: 401 }
    };

    try {
      await errorHandler(mockError);
    } catch (error) {
      // Expected to reject
    }

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth:unauthorized'
      })
    );

    dispatchEventSpy.mockRestore();
  });
});
