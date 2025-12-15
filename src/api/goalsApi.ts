import type { IGoal } from '../types';
import { apiFetch } from '../common/api';
import { API_PATHS } from './paths';

type ApiEnvelope<T> = { data: T; error?: string };

export async function fetchGoals(token: string | null) {
  const res = await apiFetch(
    API_PATHS.goals,
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

export async function createGoal(token: string | null, payload: unknown) {
  const res = await apiFetch(
    API_PATHS.goals,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    token
  );
  const result = (await res.json()) as ApiEnvelope<IGoal>;
  return { res, result };
}

export async function updateGoal(token: string | null, goalId: string, payload: unknown) {
  const res = await apiFetch(
    `${API_PATHS.goals}/${goalId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    token
  );
  const result = (await res.json()) as ApiEnvelope<IGoal>;
  return { res, result };
}

export async function deleteGoal(token: string | null, goalId: string) {
  const res = await apiFetch(
    `${API_PATHS.goals}/${goalId}`,
    {
      method: 'DELETE',
    },
    token
  );
  return { res };
}


