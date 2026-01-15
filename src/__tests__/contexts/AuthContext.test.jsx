import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
});
