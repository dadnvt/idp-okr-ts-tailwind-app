import type { IGoal } from '../types';
import { apiFetch } from '../common/api';
import { API_PATHS } from './paths';

type ApiEnvelope<T> = { data: T; error?: string };

// React 18 StrictMode (dev) intentionally mounts components twice to surface side effects.
// That can lead to duplicate API calls from mount effects. We dedupe in-flight requests here
// (module scope persists across StrictMode mount/unmount) so we only hit the server once.
const inFlightLeaderGoals = new Map<string, Promise<{ res: Response; result: ApiEnvelope<IGoal[]> }>>();

export async function fetchLeaderGoals(token: string | null) {
  // Only dedupe when we have a stable token key.
  if (token) {
    const existing = inFlightLeaderGoals.get(token);
    if (existing) return existing;

    const promise = (async () => {
      const res = await apiFetch(API_PATHS.leaderGoals, {}, token);
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

  const res = await apiFetch(API_PATHS.leaderGoals, {}, token);
  const result = (await res.json()) as ApiEnvelope<IGoal[]>;
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


