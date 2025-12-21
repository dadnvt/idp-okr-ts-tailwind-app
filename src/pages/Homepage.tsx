import { useEffect, useState } from 'react';
import { useAuth } from '../common/AuthContext';
import { signUp, confirmSignUp } from '@aws-amplify/auth';
import illustration from '../assets/illustration.svg';
import { Button } from '../components/Button';
import { apiFetch } from '../common/api';

type Team = { id: string; name: string };

export default function Homepage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'confirm'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState('');
  const [teamsLoading, setTeamsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (mode !== 'signup') return;
      if (teams.length > 0) return;
      setTeamsLoading(true);
      try {
        const res = await apiFetch('/public/teams');
        const json = (await res.json()) as { data?: Team[] };
        setTeams(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        console.error('Load teams error:', err);
        setTeams([]);
      } finally {
        setTeamsLoading(false);
      }
    };
    void load();
  }, [mode, teams.length]);

  // Đăng nhập
  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (err) {
      console.error('Login error:', err);
      alert('Đăng nhập thất bại');
    }
  };

  // Đăng ký
  const handleSignUp = async () => {
    try {
      if (!teamId) {
        alert('Vui lòng chọn team');
        return;
      }
      const { nextStep } = await signUp({
        username: email,
        password,
        options: { userAttributes: { email, locale: teamId } },
      });
      console.log('SignUp nextStep:', nextStep);
      setMode('confirm');
    } catch (err) {
      console.error('SignUp error:', err);
      alert('Đăng ký thất bại');
    }
  };

  // Xác nhận đăng ký
  const handleConfirm = async () => {
    try {
      await confirmSignUp({
            username: email,
            confirmationCode: code,
        });
      alert('Xác nhận thành công, bạn có thể đăng nhập!');
      setMode('login');
    } catch (err) {
      console.error('Confirm error:', err);
      alert('Xác nhận thất bại');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left illustration */}
      <div className="md:w-1/2 flex items-center justify-center p-10 bg-white">
        <div className="max-w-md text-center">
          <img src={illustration} alt="Welcome" className="mb-6" />
          <h1 className="text-3xl font-bold mb-4">Welcome Back :)</h1>
          <p className="text-gray-600">
            To keep connected with us please login or create account with your personal information.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="md:w-1/2 flex items-center justify-center p-10">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          {mode === 'login' && (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand focus:outline-none"
                />
                <Button onClick={handleLogin} fullWidth variant="primary">
                  Login Now
                </Button>
                <Button onClick={() => setMode('signup')} fullWidth variant="secondary">
                  Create Account
                </Button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
              <div className="space-y-4">
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand focus:outline-none bg-white"
                >
                  <option value="">{teamsLoading ? 'Loading teams...' : 'Select team'}</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand focus:outline-none"
                />
                <Button onClick={handleSignUp} fullWidth variant="success">
                  Register
                </Button>
                <Button onClick={() => setMode('login')} fullWidth variant="secondary">
                  Back to Login
                </Button>
              </div>
            </>
          )}

          {mode === 'confirm' && (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">Confirm Email</h2>
              <p className="text-sm text-gray-600 mb-3">
                Enter the confirmation code sent to your email
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Confirmation Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand focus:outline-none"
                />
                <Button onClick={handleConfirm} fullWidth variant="primary">
                  Confirm
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
