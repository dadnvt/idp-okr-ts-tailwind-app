import { AuthProvider, useAuth } from './common/AuthContext';
import MemberDashboard from './components/MemberDashboard';
import Homepage from './pages/Homepage';
import LeaderDashboard from './components/leader/LeaderDashboard';
import ManagerDashboard from './components/manager/ManagerDashboard';
import { Navigate, Route, Routes } from 'react-router-dom';
import ActionPlans from './pages/ActionPlans';
import Goals from './pages/Goals';
import WeeklyReports from './pages/WeeklyReports';
import VerifyTest from './pages/VerifyTest';
import { buildApiUrl } from './common/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import MaintenancePage from './pages/Maintenance';

function AppContent() {
  const { auth, isInitializing } = useAuth();
  const [apiDown, setApiDown] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [hasCheckedApiOnce, setHasCheckedApiOnce] = useState(false);

  const checkReachable = useCallback(async () => {
    // Treat any successful HTTP response as "reachable" (even 401/403/404),
    // and only treat network errors / 502/503/504 as "down".
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4500);
    try {
      const res = await fetch(buildApiUrl('/healthz'), {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      const isBadGateway = res.status === 502 || res.status === 503 || res.status === 504;
      if (isBadGateway) {
        setApiDown(true);
        setLastError(`Upstream returned ${res.status}`);
        return;
      }

      // Reachable
      setApiDown(false);
      setLastError(null);
    } catch (e) {
      setApiDown(true);
      setLastError(e instanceof Error ? e.message : String(e));
    } finally {
      window.clearTimeout(timeout);
      setHasCheckedApiOnce(true);
    }
  }, []);

  // Listen for global signals from apiFetch
  useEffect(() => {
    const onUnreachable = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as
        | { path?: string; url?: string; status?: number; error?: string }
        | undefined;
      setApiDown(true);
      if (detail?.status) setLastError(`Upstream returned ${detail.status} (${detail.path || ''})`);
      else if (detail?.error) setLastError(detail.error);
      else setLastError('API unreachable');
    };
    window.addEventListener('api:unreachable', onUnreachable);
    return () => window.removeEventListener('api:unreachable', onUnreachable);
  }, []);

  // Periodic health probe (auto-recover when server is back)
  useEffect(() => {
    checkReachable();
    const id = window.setInterval(checkReachable, 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [checkReachable]);

  const maintenance = useMemo(() => apiDown, [apiDown]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Loading...
      </div>
    );
  }

  // Prevent "flash" of dashboard/routes before the first health check completes.
  // If backend is down, we show Maintenance immediately after this.
  if (!hasCheckedApiOnce) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Checking system status...
      </div>
    );
  }

  if (maintenance) {
    return <MaintenancePage onRetry={checkReachable} lastError={lastError} />;
  }

  if (!auth.token) {
    return <Homepage />;
  }

  return (
    <Routes>
      {auth.user?.role === 'manager' ? (
        <>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ManagerDashboard />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      ) : auth.user?.role === 'leader' ? (
        <>
          {/* Default route for leader */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<LeaderDashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/action-plans" element={<ActionPlans />} />
          <Route path="/verify-test" element={<VerifyTest />} />
          <Route path="/weekly-reports" element={<WeeklyReports />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<MemberDashboard />} />
          <Route path="/dashboard" element={<MemberDashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/action-plans" element={<ActionPlans />} />
          <Route path="/verify-test" element={<VerifyTest />} />
          <Route path="/weekly-reports" element={<WeeklyReports />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

