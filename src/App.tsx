import { AuthProvider, useAuth } from './common/AuthContext';
import MemberDashboard from './components/MemberDashboard';
import Homepage from './pages/Homepage';
import LeaderDashboard from './components/leader/LeaderDashboard';
import { Navigate, Route, Routes } from 'react-router-dom';
import ActionPlans from './pages/ActionPlans';
import Goals from './pages/Goals';
import WeeklyReports from './pages/WeeklyReports';

function AppContent() {
  const { auth, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Loading...
      </div>
    );
  }

  if (!auth.token) {
    return <Homepage />;
  }

  return (
    <Routes>
      {auth.user?.role === 'leader' ? (
        <>
          {/* Default route for leader */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<LeaderDashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/action-plans" element={<ActionPlans />} />
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

