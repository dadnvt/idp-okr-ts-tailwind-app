import { apiFetch } from '../common/api';
import { API_PATHS } from './paths';

type ApiEnvelope<T> = { data: T; error?: string; message?: string };

export type ManagerTeam = { id: string; name: string };
export type ManagerUser = {
  id: string;
  email: string | null;
  name: string | null;
  team_id: string | null;
  team_name: string | null;
  role: string | null;
};

export type ManagerOverview = {
  year: number;
  team_id: string | null;
  window: { from: string; to: string; weeks: number };
  org: unknown;
  per_team: Array<
    {
      team_id: string;
      team_name: string;
    } & Record<string, unknown>
  >;
  trends: { weeks: Array<{ week: string; active_members: number; active_rate: number }> };
};

export type ManagerTeamMemberSummary = {
  year: number;
  team_id: string;
  team_name: string | null;
  window: { from: string; to: string; weeks: number };
  members: Array<
    {
      user_id: string;
      name: string | null;
      email: string | null;
      team_id: string;
      team_name: string | null;
      goals: { total: number; approved: number; pending: number; progress_avg: number };
      progress_delta: number | null;
      action_plans: {
        total: number;
        overdue: number;
        completed: number;
        completed_with_evidence: number;
        evidence_rate: number;
      };
      weekly_reports: { reports_in_window: number; weeks_with_activity: number; streak_weeks: number };
      verifications: { pending: number; reviewed: number };
    } & Record<string, unknown>
  >;
  top?: Record<string, unknown>;
  bottom?: Record<string, unknown>;
};

export async function fetchManagerTeams(token: string | null) {
  const res = await apiFetch(API_PATHS.managerTeams, {}, token);
  const result = (await res.json()) as ApiEnvelope<ManagerTeam[]>;
  return { res, result };
}

export async function fetchManagerUsers(
  token: string | null,
  params: { teamId?: string; limit?: number; offset?: number } = {}
) {
  const qs = new URLSearchParams();
  if (typeof params.teamId === 'string' && params.teamId.trim()) qs.set('team_id', params.teamId.trim());
  if (typeof params.limit === 'number') qs.set('limit', String(params.limit));
  if (typeof params.offset === 'number') qs.set('offset', String(params.offset));
  const path = qs.toString() ? `${API_PATHS.managerUsers}?${qs.toString()}` : API_PATHS.managerUsers;

  const res = await apiFetch(path, {}, token);
  const result = (await res.json()) as ApiEnvelope<ManagerUser[]> & { page?: unknown };
  return { res, result };
}

export async function fetchManagerOverview(
  token: string | null,
  params: { year: number; teamId?: string; weeks?: number }
) {
  const qs = new URLSearchParams();
  qs.set('year', String(params.year));
  if (typeof params.teamId === 'string' && params.teamId.trim()) qs.set('team_id', params.teamId.trim());
  if (typeof params.weeks === 'number') qs.set('weeks', String(params.weeks));
  const path = `${API_PATHS.managerOverview}?${qs.toString()}`;

  const res = await apiFetch(path, {}, token);
  const result = (await res.json()) as ApiEnvelope<ManagerOverview>;
  return { res, result };
}

export async function fetchManagerMemberInsights(
  token: string | null,
  params: { year: number; userId: string; weeks?: number }
) {
  const qs = new URLSearchParams();
  qs.set('year', String(params.year));
  qs.set('user_id', params.userId);
  if (typeof params.weeks === 'number') qs.set('weeks', String(params.weeks));
  const path = `${API_PATHS.managerMemberInsights}?${qs.toString()}`;

  const res = await apiFetch(path, {}, token);
  const result = (await res.json()) as ApiEnvelope<unknown>;
  return { res, result };
}

export async function fetchManagerTeamMembersSummary(
  token: string | null,
  params: { year: number; teamId: string; weeks?: number }
) {
  const qs = new URLSearchParams();
  qs.set('year', String(params.year));
  qs.set('team_id', params.teamId);
  if (typeof params.weeks === 'number') qs.set('weeks', String(params.weeks));
  const path = `${API_PATHS.managerTeamMembersSummary}?${qs.toString()}`;

  const res = await apiFetch(path, {}, token);
  const result = (await res.json()) as ApiEnvelope<ManagerTeamMemberSummary>;
  return { res, result };
}

export type ManagerTeamMembersTrends = {
  year: number;
  team_id: string;
  team_name: string | null;
  window: { from: string; to: string; weeks: number };
  weeks: string[];
  members: Array<{
    user_id: string;
    name: string | null;
    email: string | null;
    reports_by_week: number[];
  }>;
};

export async function fetchManagerTeamMembersTrends(
  token: string | null,
  params: { year: number; teamId: string; weeks?: number }
) {
  const qs = new URLSearchParams();
  qs.set('year', String(params.year));
  qs.set('team_id', params.teamId);
  if (typeof params.weeks === 'number') qs.set('weeks', String(params.weeks));
  const path = `${API_PATHS.managerTeamMembersTrends}?${qs.toString()}`;

  const res = await apiFetch(path, {}, token);
  const result = (await res.json()) as ApiEnvelope<ManagerTeamMembersTrends>;
  return { res, result };
}


