import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function useAuthGate() {
  const { isAuthenticated, openLoginModal, pendingAction, setPendingAction } = useAuth();

  const requireAuth = useCallback(
    (action) => {
      if (isAuthenticated) {
        action?.();
        return;
      }

      setPendingAction(() => action || null);
      openLoginModal();
    },
    [isAuthenticated, openLoginModal, setPendingAction]
  );

  const continueAfterLogin = useCallback(
    () => {
      if (!pendingAction) return;
      const action = pendingAction;
      setPendingAction(null);
      action?.();
    },
    [pendingAction, setPendingAction]
  );

  return { requireAuth, continueAfterLogin };
}
