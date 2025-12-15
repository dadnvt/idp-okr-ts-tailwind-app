import { useState } from 'react';
import { signUp, confirmSignUp } from '@aws-amplify/auth';

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

  if (!isOpen) return null;

  const handleSignUp = async () => {
    try {
      const { nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
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
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {step === 'signup' && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center">Đăng ký</h2>
            <div className="space-y-4">
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
              <button
                onClick={handleSignUp}
                className="w-full bg-brand text-white py-2 rounded-lg hover:bg-brand-dark transition"
              >
                Đăng ký
              </button>
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
              <button
                onClick={handleConfirm}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
              >
                Xác nhận
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
