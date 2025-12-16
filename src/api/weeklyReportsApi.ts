import type { IWeeklyReport } from '../types';
import { apiFetch } from '../common/api';
import { API_PATHS } from './paths';

type ApiEnvelope<T> = { data: T; error?: string };

export async function fetchWeeklyReportsByActionPlan(
  token: string | null,
  actionPlanId: string,
  params: { limit?: number; offset?: number } = {}
) {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });

  const res = await apiFetch(
    `/action-plans/${actionPlanId}/weekly-reports?${qs.toString()}`,
    { method: 'GET' },
    token
  );

  const raw = (await res.json()) as ApiEnvelope<IWeeklyReport[]> & {
    message?: string;
    error?: string;
    page?: { limit: number; offset: number; returned: number };
  };

  return {
    res,
    result: {
      data: raw.data ?? [],
      error: raw.error || raw.message,
      page: raw.page,
    },
  };
}

export async function createWeeklyReport(
  token: string | null,
  actionPlanId: string,
  payload: Omit<IWeeklyReport, 'id'>
) {
  const res = await apiFetch(
    `/action-plans/${actionPlanId}/weekly-reports`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    token
  );
  const result = (await res.json()) as ApiEnvelope<IWeeklyReport>;
  return { res, result };
}

export async function updateWeeklyReport(
  token: string | null,
  weeklyReportId: string,
  payload: Partial<IWeeklyReport>
) {
  const res = await apiFetch(
    `${API_PATHS.weeklyReports}/${weeklyReportId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    token
  );
  const result = (await res.json()) as ApiEnvelope<IWeeklyReport>;
  return { res, result };
}

export async function deleteWeeklyReport(token: string | null, weeklyReportId: string) {
  const res = await apiFetch(
    `${API_PATHS.weeklyReports}/${weeklyReportId}`,
    { method: 'DELETE' },
    token
  );
  return { res };
}


