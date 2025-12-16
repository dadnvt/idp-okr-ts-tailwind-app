import type { IGoal } from '../types';
import { apiFetch } from '../common/api';
import { API_PATHS } from './paths';

type ApiEnvelope<T> = { data: T; error?: string };
type ApiErrorShape = { error?: string; message?: string };

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
  const raw = (await res.json()) as ApiEnvelope<IGoal[]> & ApiErrorShape;
  const result: ApiEnvelope<IGoal[]> = { data: raw.data ?? [], error: raw.error || raw.message };
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
  const raw = (await res.json()) as ApiEnvelope<IGoal> & ApiErrorShape;
  const result: ApiEnvelope<IGoal> = {
    data: (raw.data ?? (null as unknown as IGoal)),
    error: raw.error || raw.message,
  };
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
  const raw = (await res.json()) as ApiEnvelope<IGoal> & ApiErrorShape;
  const result: ApiEnvelope<IGoal> = {
    data: (raw.data ?? (null as unknown as IGoal)),
    error: raw.error || raw.message,
  };
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

export async function requestGoalReview(token: string | null, goalId: string) {
  const res = await apiFetch(
    `${API_PATHS.goals}/${goalId}/request-review`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token
  );
  const raw = (await res.json()) as ApiEnvelope<IGoal> & ApiErrorShape;
  const result: ApiEnvelope<IGoal> = { data: raw.data, error: raw.error || raw.message };
  return { res, result };
}

export async function cancelGoalReview(token: string | null, goalId: string) {
  const res = await apiFetch(
    `${API_PATHS.goals}/${goalId}/cancel-review`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token
  );
  const raw = (await res.json()) as ApiEnvelope<IGoal> & ApiErrorShape;
  const result: ApiEnvelope<IGoal> = { data: raw.data, error: raw.error || raw.message };
  return { res, result };
}


