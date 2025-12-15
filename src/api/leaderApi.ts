import type { IGoal } from '../types';
import { apiFetch } from '../common/api';
import { API_PATHS } from './paths';

type ApiEnvelope<T> = { data: T; error?: string };

export async function fetchLeaderGoals(token: string | null) {
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


