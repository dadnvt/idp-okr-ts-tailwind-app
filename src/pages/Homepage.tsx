import { useEffect, useState } from 'react';
import { useAuth } from '../common/AuthContext';
import {
  signUp,
  confirmSignUp,
  signOut,
  resetPassword,
  confirmResetPassword,
} from '@aws-amplify/auth';
import illustration from '../assets/illustration.svg';
import { Button } from '../components/Button';
import { apiFetch } from '../common/api';

type Team = { id: string; name: string };

export default function Homepage() {
  const { login, completeNewPassword } = useAuth();
  const [mode, setMode] = useState<
    'login' | 'signup' | 'confirm' | 'newPassword' | 'forgot' | 'forgotConfirm'
  >('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
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
      const res = await login(email, password);
      if (res.status === 'NEW_PASSWORD_REQUIRED') {
        setMode('newPassword');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Đăng nhập thất bại');
    }
  };

  const handleCompleteNewPassword = async () => {
    try {
      if (!newPassword || newPassword.length < 8) {
        alert('Mật khẩu mới phải tối thiểu 8 ký tự');
        return;
      }
      await completeNewPassword(newPassword);
      setNewPassword('');
      alert('Đổi mật khẩu thành công');
    } catch (err) {
      console.error('Complete new password error:', err);
      alert('Đổi mật khẩu thất bại');
    }
  };

  // Đăng ký
  const handleSignUp = async () => {
    try {
      if (!teamId) {
        alert('Vui lòng chọn team');
        return;
      }

      // If user is already signed in, Amplify will throw UserAlreadyAuthenticatedException on signUp.
      // We silently sign out to make signup flow robust (common when testing with the same browser).
      try {
        await signOut();
      } catch {
        // ignore
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

  const handleForgotPassword = async () => {
    try {
      if (!email) {
        alert('Vui lòng nhập email');
        return;
      }
      await resetPassword({ username: email });
      setMode('forgotConfirm');
      alert('Đã gửi mã xác nhận về email (nếu email tồn tại)');
    } catch (err) {
      console.error('Forgot password error:', err);
      alert('Gửi mã thất bại');
    }
  };

  const handleForgotConfirm = async () => {
    try {
      if (!email) {
        alert('Vui lòng nhập email');
        return;
      }
      if (!code) {
        alert('Vui lòng nhập mã xác nhận');
        return;
      }
      if (!newPassword || newPassword.length < 8) {
        alert('Mật khẩu mới phải tối thiểu 8 ký tự');
        return;
      }
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
      setCode('');
      setNewPassword('');
      alert('Reset mật khẩu thành công. Bạn có thể đăng nhập!');
      setMode('login');
    } catch (err) {
      console.error('Forgot confirm error:', err);
      alert('Reset mật khẩu thất bại');
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
                <Button onClick={() => setMode('forgot')} fullWidth variant="secondary">
                  Forgot Password
                </Button>
                <Button onClick={() => setMode('signup')} fullWidth variant="secondary">
                  Create Account
                </Button>
              </div>
            </>
          )}

          {mode === 'newPassword' && (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">Set New Password</h2>
              <p className="text-sm text-gray-600 mb-3">
                Tài khoản của bạn đang dùng mật khẩu tạm. Vui lòng đặt mật khẩu mới để tiếp tục.
              </p>
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand focus:outline-none"
                />
                <Button onClick={handleCompleteNewPassword} fullWidth variant="primary">
                  Update Password
                </Button>
                <Button onClick={() => setMode('login')} fullWidth variant="secondary">
                  Back to Login
                </Button>
              </div>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand focus:outline-none"
                />
                <Button onClick={handleForgotPassword} fullWidth variant="primary">
                  Send Code
                </Button>
                <Button onClick={() => setMode('login')} fullWidth variant="secondary">
                  Back to Login
                </Button>
              </div>
            </>
          )}

          {mode === 'forgotConfirm' && (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
              <p className="text-sm text-gray-600 mb-3">
                Nhập mã xác nhận và mật khẩu mới
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Confirmation Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand focus:outline-none"
                />
                <Button onClick={handleForgotConfirm} fullWidth variant="primary">
                  Reset Password
                </Button>
                <Button onClick={() => setMode('login')} fullWidth variant="secondary">
                  Back to Login
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
