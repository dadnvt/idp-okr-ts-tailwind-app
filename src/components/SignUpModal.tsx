import { useEffect, useState } from 'react';
import { signUp, confirmSignUp, signOut } from '@aws-amplify/auth';
import { Button } from './Button';
import { apiFetch } from '../common/api';

type Team = { id: string; name: string };

export default function SignUpModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'signup' | 'confirm'>('signup');
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState('');
  const [teamsLoading, setTeamsLoading] = useState(false);

  if (!isOpen) return null;

  useEffect(() => {
    const load = async () => {
      if (!isOpen) return;
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
  }, [isOpen, teams.length]);

  const handleSignUp = async () => {
    try {
      if (!teamId) {
        alert('Vui lòng chọn team');
        return;
      }

      // Avoid UserAlreadyAuthenticatedException when a session already exists.
      try {
        await signOut();
      } catch {
        // ignore
      }

      const { nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            locale: teamId,
          },
        },
      });

      console.log('SignUp nextStep:', nextStep);

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setStep('confirm');
      }
    } catch (err) {
      console.error('SignUp error:', err);
      alert('Đăng ký thất bại');
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      alert('Xác nhận thành công, bạn có thể đăng nhập!');
      onClose();

      // reset state (optional)
      setEmail('');
      setPassword('');
      setCode('');
      setStep('signup');
    } catch (err) {
      console.error('Confirm error:', err);
      alert('Mã xác nhận không đúng hoặc đã hết hạn');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative animate-fadeIn">
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ✕
        </Button>

        {step === 'signup' && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center">Đăng ký</h2>
            <div className="space-y-4">
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand focus:outline-none bg-white"
              >
                <option value="">{teamsLoading ? 'Loading teams...' : 'Chọn team'}</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand focus:outline-none"
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand focus:outline-none"
              />
              <Button onClick={handleSignUp} fullWidth variant="primary">
                Đăng ký
              </Button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center">
              Xác nhận Email
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Nhập mã xác nhận đã gửi tới email của bạn
            </p>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Mã xác nhận"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand focus:outline-none"
              />
              <Button onClick={handleConfirm} fullWidth variant="success">
                Xác nhận
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
