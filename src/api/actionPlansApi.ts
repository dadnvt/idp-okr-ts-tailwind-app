import type { IActionPlan, IGoal } from '../types';
import { apiFetch } from '../common/api';
import { API_PATHS } from './paths';

type ApiEnvelope<T> = { data: T; error?: string };
type ApiErrorShape = { error?: string; message?: string };

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
  const raw = (await res.json()) as ApiEnvelope<IGoal[]> & ApiErrorShape;
  const result: ApiEnvelope<IGoal[]> = { data: raw.data ?? [], error: raw.error || raw.message };
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
  const raw = (await res.json()) as ApiEnvelope<IActionPlan> & ApiErrorShape;
  const result: ApiEnvelope<IActionPlan> = {
    data: (raw.data ?? (null as unknown as IActionPlan)),
    error: raw.error || raw.message,
  };
  return { res, result };
}

export async function updateActionPlan(
  token: string | null,
  actionPlanId: string,
  payload: Partial<IActionPlan>
) {
  const res = await apiFetch(
    `${API_PATHS.actionPlans}/${actionPlanId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    token
  );
  const result = (await res.json()) as ApiEnvelope<IActionPlan> & { message?: string; error?: string };
  return { res, result: { data: result.data, error: result.error || result.message } as ApiEnvelope<IActionPlan> };
}

export async function requestActionPlanReview(token: string | null, actionPlanId: string) {
  const res = await apiFetch(
    `${API_PATHS.actionPlans}/${actionPlanId}/request-review`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token
  );
  const raw = (await res.json()) as ApiEnvelope<IActionPlan> & ApiErrorShape;
  const result: ApiEnvelope<IActionPlan> = {
    data: (raw.data ?? (null as unknown as IActionPlan)),
    error: raw.error || raw.message,
  };
  return { res, result };
}

export async function cancelActionPlanReview(token: string | null, actionPlanId: string) {
  const res = await apiFetch(
    `${API_PATHS.actionPlans}/${actionPlanId}/cancel-review`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token
  );
  const raw = (await res.json()) as ApiEnvelope<IActionPlan> & ApiErrorShape;
  const result: ApiEnvelope<IActionPlan> = {
    data: (raw.data ?? (null as unknown as IActionPlan)),
    error: raw.error || raw.message,
  };
  return { res, result };
}


