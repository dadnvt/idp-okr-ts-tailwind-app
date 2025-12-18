import { Button } from '../components/Button';

export default function MaintenancePage(props: { onRetry?: () => void; lastError?: string | null }) {
  const { onRetry } = props;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">System Maintenance in Progress</h1>

        <p className="mt-6 text-xs text-gray-500">
          🚫 The server is currently offline. Operating hours are 13:00 – 16:00 (VNT) on Thursday and Friday. 
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button variant="primary" onClick={onRetry || (() => window.location.reload())}>
            Try again
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    </div>
  );
}
