import type { IActionPlan, IGoal } from '../types';
import { apiFetch } from '../common/api';
import { API_PATHS } from './paths';

type ApiEnvelope<T> = { data: T; error?: string };

export async function fetchActionPlansByYear(token: string | null, year: number) {
  const res = await apiFetch(
    `${API_PATHS.actionPlans}?year=${year}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token
  );
  const result = (await res.json()) as ApiEnvelope<IGoal[]>;
  return { res, result };
}

export async function createActionPlan(
  token: string | null,
  goalId: string,
  payload: IActionPlan
) {
  const res = await apiFetch(
    `${API_PATHS.goals}/${goalId}/action-plans`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    token
  );
  const result = (await res.json()) as ApiEnvelope<IActionPlan>;
  return { res, result };
}


