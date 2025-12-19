import type { IGoal } from '../types';
import { apiFetch } from '../common/api';
import { API_PATHS } from './paths';

type ApiEnvelope<T> = { data: T; error?: string };
export type LeaderWeeklyReportStats = Record<
  string,
  { lastReportDate: string | null; hasReportInRange: boolean }
>;

export type LeaderGoalsSummary = {
  total: number;
  approved: number;
  pending: number;
  avgProgress: number;
};

// React 18 StrictMode (dev) intentionally mounts components twice to surface side effects.
// That can lead to duplicate API calls from mount effects. We dedupe in-flight requests here
// (module scope persists across StrictMode mount/unmount) so we only hit the server once.
const inFlightLeaderGoals = new Map<string, Promise<{ res: Response; result: ApiEnvelope<IGoal[]> }>>();

export async function fetchLeaderGoals(
  token: string | null,
  params: { year?: number; userId?: string; teamId?: string; limit?: number; offset?: number } = {}
) {
  const qs = new URLSearchParams();
  if (typeof params.year === 'number') qs.set('year', String(params.year));
  if (typeof params.userId === 'string' && params.userId.trim()) qs.set('user_id', params.userId.trim());
  if (typeof params.teamId === 'string' && params.teamId.trim()) qs.set('team_id', params.teamId.trim());
  if (typeof params.limit === 'number') qs.set('limit', String(params.limit));
  if (typeof params.offset === 'number') qs.set('offset', String(params.offset));
  const path = qs.toString() ? `${API_PATHS.leaderGoals}?${qs.toString()}` : API_PATHS.leaderGoals;

  // Only dedupe when we have a stable token key.
  if (token && !qs.toString()) {
    // Only dedupe the "default" call (no params) to avoid cache poisoning between different pages/years.
    const existing = inFlightLeaderGoals.get(token);
    if (existing) return existing;

    const promise = (async () => {
      const res = await apiFetch(path, {}, token);
      const result = (await res.json()) as ApiEnvelope<IGoal[]>;
      return { res, result };
    })();

    inFlightLeaderGoals.set(token, promise);
    try {
      return await promise;
    } finally {
      inFlightLeaderGoals.delete(token);
    }
  }

  const res = await apiFetch(path, {}, token);
  const result = (await res.json()) as ApiEnvelope<IGoal[]>;
  return { res, result };
}

export async function fetchLeaderGoalsSummary(
  token: string | null,
  params: { year: number; userId?: string; teamId?: string }
) {
  const qs = new URLSearchParams();
  qs.set('year', String(params.year));
  if (typeof params.userId === 'string' && params.userId.trim()) qs.set('user_id', params.userId.trim());
  if (typeof params.teamId === 'string' && params.teamId.trim()) qs.set('team_id', params.teamId.trim());
  const path = `${API_PATHS.leaderGoals}/summary?${qs.toString()}`;

  const res = await apiFetch(path, {}, token);
  const result = (await res.json()) as ApiEnvelope<LeaderGoalsSummary> & { error?: string; message?: string };
  return { res, result };
}

export async function reviewLeaderGoal(
  token: string | null,
  goalId: string,
  review: unknown
) {
  const res = await apiFetch(
    `${API_PATHS.leaderGoals}/${goalId}/review`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(review),
    },
    token
  );
  return { res };
}

export async function reviewLeaderActionPlan(
  token: string | null,
  actionPlanId: string,
  review: unknown
) {
  const res = await apiFetch(
    `${API_PATHS.leaderActionPlans}/${actionPlanId}/review`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(review),
    },
    token
  );
  return { res };
}

export async function fetchLeaderWeeklyReportStats(
  token: string | null,
  params: { year: number; userId?: string; from: string; to: string }
) {
  const qs = new URLSearchParams();
  qs.set('year', String(params.year));
  qs.set('from', params.from);
  qs.set('to', params.to);
  if (typeof params.userId === 'string' && params.userId.trim()) qs.set('user_id', params.userId.trim());
  const path = `${API_PATHS.leaderWeeklyReportStats}?${qs.toString()}`;

  const res = await apiFetch(path, {}, token);
  const result = (await res.json()) as ApiEnvelope<LeaderWeeklyReportStats> & {
    meta?: unknown;
    error?: string;
  };
  return { res, result };
}


