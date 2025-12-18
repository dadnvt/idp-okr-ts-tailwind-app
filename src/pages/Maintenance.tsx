import { Button } from '../components/Button';
import { API_BASE_URL } from '../common/api';

export default function MaintenancePage(props: { onRetry?: () => void; lastError?: string | null }) {
  const { onRetry, lastError } = props;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">System Maintenance in Progress</h1>

        <div className="mt-6 flex items-center gap-3">
          <Button variant="primary" onClick={onRetry || (() => window.location.reload())}>
            Thử lại
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload trang
          </Button>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Gợi ý: Nếu EC2 vừa bật lại, có thể cần 1–2 phút để service sẵn sàng.
        </p>
      </div>
    </div>
  );
}
