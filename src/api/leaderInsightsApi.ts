import { apiFetch } from '../common/api';
import { API_PATHS } from './paths';

type ApiEnvelope<T> = { data: T; error?: string };

export type LeaderMemberInsights = {
  user_id: string;
  year: number;
  window: { from: string; to: string; weeks: number };
  goals: {
    total: number;
    approved: number;
    pending: number;
    health: { onTrack: number; atRisk: number; highRisk: number; stagnant: number };
  };
  action_plans: {
    total: number;
    overdue: number;
    completed: number;
    completed_with_evidence: number;
    evidence_rate: number;
  };
  weekly_reports: {
    reports_in_window: number;
    weeks_with_activity: number;
    streak_weeks: number;
    top_blockers: Array<{ text: string; count: number }>;
  };
  progress_delta: number | null;
};

export async function fetchLeaderMemberInsights(
  token: string | null,
  params: { year: number; userId: string; weeks?: number }
) {
  const qs = new URLSearchParams();
  qs.set('year', String(params.year));
  qs.set('user_id', params.userId);
  if (typeof params.weeks === 'number') qs.set('weeks', String(params.weeks));

  const res = await apiFetch(`${API_PATHS.leaderMemberInsights}?${qs.toString()}`, { method: 'GET' }, token);
  const raw = (await res.json()) as ApiEnvelope<LeaderMemberInsights> & { message?: string; error?: string };
  return { res, result: { data: raw.data, error: raw.error || raw.message } };
}


