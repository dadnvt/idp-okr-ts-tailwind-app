import { AuthProvider, useAuth } from './common/AuthContext';
import MemberDashboard from './components/MemberDashboard';
import Homepage from './pages/Homepage';
import  { useState } from 'react';
import LeaderDashboard from './components/leader/LeaderDashboard';
import { Route, Routes } from 'react-router-dom';
import ActionPlans from './pages/ActionPlans';
import Goals from './pages/Goals';
import WeeklyReports from './pages/WeeklyReports';

function AppContent() {
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);
  const { auth } = useAuth();

  if (!auth.token) {
    return <Homepage />;
  }

  return (
    <Routes>
      {auth.user?.role === 'leader' ? (
        <>
          <Route path="/dashboard" element={<LeaderDashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/action-plans" element={<ActionPlans />} />
          <Route path="/weekly-reports" element={<WeeklyReports />} />
        </>
      ) : (
        <>
          <Route path="/" element={<MemberDashboard onDetailClick={(goal) => setSelectedGoal(goal)} />} />
          <Route path="/dashboard" element={<MemberDashboard onDetailClick={(goal) => setSelectedGoal(goal)} />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/action-plans" element={<ActionPlans />} />
          <Route path="/weekly-reports" element={<WeeklyReports />} />
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

