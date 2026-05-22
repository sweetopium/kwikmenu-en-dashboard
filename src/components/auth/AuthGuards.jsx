import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { fetchCurrentUser } from '../../lib/sessionApi';

const DashboardSkeleton = () => (
  <div className="flex min-h-screen w-full bg-secondary/20">
    {/* Sidebar Skeleton */}
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border/60 fixed inset-y-0 z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-8 w-8 rounded-[0.6rem] bg-brand-purple/20 animate-pulse shrink-0" />
        <div className="h-5 w-24 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Main menu label */}
      <div className="h-3 w-16 bg-muted/60 animate-pulse rounded-md mb-4" />

      {/* Nav items */}
      <div className="space-y-4 flex-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-1">
            <div className="h-5 w-5 bg-muted animate-pulse rounded-md shrink-0" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
          </div>
        ))}
      </div>

      {/* Need Help card */}
      <div className="bg-secondary/40 border border-border/50 rounded-2xl p-4 mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-muted animate-pulse rounded-full shrink-0" />
          <div className="h-3.5 w-20 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="h-3 w-full bg-muted animate-pulse rounded-md" />
        <div className="h-3 w-2/3 bg-muted animate-pulse rounded-md" />
        <div className="h-9 w-full bg-muted animate-pulse rounded-lg" />
      </div>

      {/* Logout button */}
      <div className="flex items-center gap-3 px-3 py-1 mt-2">
        <div className="h-5 w-5 bg-muted animate-pulse rounded-md shrink-0" />
        <div className="h-4 w-12 bg-muted animate-pulse rounded-md" />
      </div>
    </aside>

    {/* Content Skeleton */}
    <div className="flex-1 md:pl-64 flex flex-col min-h-screen w-full">
      {/* Header Skeleton */}
      <header className="h-[72px] border-b border-border/60 flex items-center justify-between px-4 sm:px-8 bg-card">
        <div className="md:hidden flex items-center gap-3">
          <div className="h-9 w-9 bg-muted animate-pulse rounded-lg shrink-0" />
          <div className="h-7 w-7 bg-brand-purple/20 animate-pulse rounded-[0.5rem] shrink-0" />
        </div>
        
        <div className="ml-auto flex items-center gap-3">
          <div className="h-9 w-12 bg-muted animate-pulse rounded-xl shrink-0" />
          <div className="h-10 w-36 bg-muted animate-pulse rounded-xl shrink-0" />
        </div>
      </header>

      {/* Page Content Skeleton */}
      <main className="flex-1 p-4 sm:p-8 space-y-6">
        {/* Page Title & Subtitle */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-72 bg-muted animate-pulse rounded-md" />
        </div>

        {/* Dashboard-like card blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-muted animate-pulse shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
                <div className="h-3 w-48 bg-muted animate-pulse rounded-md" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-full bg-secondary/50 rounded-xl" />
              <div className="h-10 w-full bg-secondary/50 rounded-xl" />
            </div>
            <div className="h-10 w-24 bg-muted animate-pulse rounded-lg ml-auto" />
          </div>

          <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-muted animate-pulse shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
                <div className="h-3 w-36 bg-muted animate-pulse rounded-md" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-full bg-secondary/50 rounded-xl" />
              <div className="h-10 w-full bg-secondary/50 rounded-xl" />
            </div>
            <div className="h-10 w-32 bg-muted animate-pulse rounded-lg ml-auto" />
          </div>

          <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-muted animate-pulse shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-28 bg-muted animate-pulse rounded-md" />
                <div className="h-3 w-40 bg-muted animate-pulse rounded-md" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-full bg-secondary/50 rounded-xl" />
              <div className="h-10 w-full bg-secondary/50 rounded-xl" />
            </div>
            <div className="h-10 w-28 bg-muted animate-pulse rounded-lg ml-auto" />
          </div>
        </div>

        {/* Large block (analytics / data view representation) */}
        <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm min-h-[300px] flex flex-col">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-muted animate-pulse rounded-md" />
              <div className="h-3 w-64 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="h-10 w-28 bg-muted animate-pulse rounded-xl" />
          </div>
          
          <div className="flex-1 flex flex-col justify-end gap-2 pt-6">
            <div className="h-4 w-full bg-muted/30 animate-pulse rounded-md" />
            <div className="h-4 w-full bg-muted/30 animate-pulse rounded-md" />
            <div className="h-4 w-full bg-muted/30 animate-pulse rounded-md" />
            <div className="h-4 w-full bg-muted/30 animate-pulse rounded-md" />
          </div>
        </div>
      </main>
    </div>
  </div>
);

const LoadingScreen = () => {
  const isDashboard = typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard');

  if (isDashboard) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/20 px-6">
      <div className="rounded-3xl border border-border/60 bg-card px-6 py-5 text-sm font-medium text-muted-foreground shadow-sm">
        Проверяем сессию...
      </div>
    </div>
  );
};

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
