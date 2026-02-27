import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginModal from '../../components/LoginModal';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: {} }),
}));

jest.mock('../../services/auth', () => ({
  authService: {
    sendSmsCode: jest.fn(),
    verifySmsCode: jest.fn(),
  },
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
    isAuthenticated: false,
  }),
}));

test('renders login modal when open', () => {
  render(<LoginModal open onClose={() => {}} />);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
