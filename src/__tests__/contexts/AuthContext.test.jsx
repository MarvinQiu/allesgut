import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';

// Mock auth service
jest.mock('../../services/auth', () => ({
  authService: {
    restoreSession: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: jest.fn(),
    getStoredUser: jest.fn(),
  }
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (isAuthenticated) return <div>Welcome, {user.nickname}</div>;
  return <div>Please login</div>;
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading state initially', () => {
    authService.restoreSession.mockImplementation(() => new Promise(() => {}));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows user when authenticated', async () => {
    authService.restoreSession.mockResolvedValue({ id: 1, nickname: 'TestUser' });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome, TestUser')).toBeInTheDocument();
    });
  });

  test('shows login prompt when not authenticated', async () => {
    authService.restoreSession.mockResolvedValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Please login')).toBeInTheDocument();
    });
  });

  test('login function sets user', async () => {
    authService.restoreSession.mockResolvedValue(null);

    const LoginButton = () => {
      const { login, user } = useAuth();
      return (
        <>
          <button onClick={() => login({ id: 1, nickname: 'NewUser' })}>Login</button>
          {user && <span>User: {user.nickname}</span>}
        </>
      );
    };

    render(
      <AuthProvider>
        <LoginButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('Login')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Login'));
    await waitFor(() => expect(screen.getByText('User: NewUser')).toBeInTheDocument());
  });

  test('logout function clears user and calls authService', async () => {
    authService.restoreSession.mockResolvedValue({ id: 1, nickname: 'TestUser' });
    authService.logout.mockResolvedValue(undefined);

    const LogoutButton = () => {
      const { logout, user } = useAuth();
      return (
        <>
          <button onClick={logout}>Logout</button>
          {user ? <span>Logged in</span> : <span>Logged out</span>}
        </>
      );
    };

    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('Logged in')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Logout'));
    await waitFor(() => expect(screen.getByText('Logged out')).toBeInTheDocument());
    expect(authService.logout).toHaveBeenCalled();
  });

  test('updateUser function merges updates with existing user', async () => {
    authService.restoreSession.mockResolvedValue({ id: 1, nickname: 'TestUser', email: 'test@example.com' });

    const UpdateButton = () => {
      const { updateUser, user } = useAuth();
      return (
        <>
          <button onClick={() => updateUser({ nickname: 'UpdatedUser' })}>Update</button>
          {user && <span>User: {user.nickname}, Email: {user.email}</span>}
        </>
      );
    };

    render(
      <AuthProvider>
        <UpdateButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('User: TestUser, Email: test@example.com')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Update'));
    await waitFor(() => expect(screen.getByText('User: UpdatedUser, Email: test@example.com')).toBeInTheDocument());
  });

  test('session restoration failure sets user to null', async () => {
    authService.restoreSession.mockRejectedValue(new Error('Network error'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Please login')).toBeInTheDocument();
    });
  });

  test('useAuth throws when used outside provider', () => {
    const TestOutside = () => {
      useAuth();
      return null;
    };

    // Suppress console.error for this test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestOutside />)).toThrow('useAuth must be used within an AuthProvider');

    spy.mockRestore();
  });
});
