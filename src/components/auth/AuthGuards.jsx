import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { fetchCurrentUser } from '../../lib/sessionApi';

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-secondary/20 px-6">
    <div className="rounded-3xl border border-border/60 bg-card px-6 py-5 text-sm font-medium text-muted-foreground shadow-sm">
      Проверяем сессию...
    </div>
  </div>
);

const useSessionStatus = () => {
  const [state, setState] = useState({ checked: false, authenticated: false });

  useEffect(() => {
    let cancelled = false;

    fetchCurrentUser()
      .then(() => {
        if (!cancelled) {
          setState({ checked: true, authenticated: true });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ checked: true, authenticated: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};

export const ProtectedRoute = ({ children }) => {
  const { checked, authenticated } = useSessionStatus();

  if (!checked) {
    return <LoadingScreen />;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const PublicOnlyRoute = ({ children }) => {
  const { checked, authenticated } = useSessionStatus();

  if (!checked) {
    return <LoadingScreen />;
  }

  if (authenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
