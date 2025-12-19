import { apiFetch } from '../common/api';
import { API_PATHS } from './paths';

type ApiEnvelope<T> = { data: T; error?: string };

export type VerificationTemplate = {
  id: string;
  name: string;
  category?: string | null;
  scoring_type: 'rubric' | 'passfail' | string;
  criteria: Array<{ id?: string; label: string; description?: string; weight?: number }>;
  required_evidence: Array<{ type: string; label: string; required?: boolean }>;
  minimum_bar?: unknown;
};

export type VerificationRequestRow = {
  id: string;
  requester_id: string;
  goal_id: string;
  action_plan_id?: string | null;
  template_id?: string | null;
  scope: string;
  evidence_links: string[];
  status: 'Pending' | 'Reviewed' | 'Cancelled' | string;
  created_at: string;
  updated_at: string;
  // shaped fields
  member_name?: string | null;
  member_email?: string | null;
  team_id?: string | null;
  team_name?: string | null;
  goal?: { id: string; name: string; year: number; user_id: string } | null;
  verification_reviews?: Array<{
    id: string;
    leader_id: string;
    result: 'Pass' | 'NeedsWork' | 'Fail' | string;
    scores: Record<string, unknown>;
    leader_feedback?: string | null;
    reviewed_at: string;
  }>;
  member_notes?: string | null;
  rubric_snapshot?: unknown;
};

export async function fetchVerificationTemplates(token: string | null) {
  const res = await apiFetch('/verification-templates', { method: 'GET' }, token);
  const raw = (await res.json()) as ApiEnvelope<VerificationTemplate[]> & { message?: string; error?: string };
  return { res, result: { data: raw.data ?? [], error: raw.error || raw.message } };
}

export async function fetchVerificationRequests(
  token: string | null,
  params: { year?: number; status?: string; teamId?: string; userId?: string; limit?: number; offset?: number } = {}
) {
  const qs = new URLSearchParams();
  if (typeof params.year === 'number') qs.set('year', String(params.year));
  if (params.status) qs.set('status', params.status);
  if (params.teamId) qs.set('team_id', params.teamId);
  if (params.userId) qs.set('user_id', params.userId);
  if (typeof params.limit === 'number') qs.set('limit', String(params.limit));
  if (typeof params.offset === 'number') qs.set('offset', String(params.offset));

  const path = qs.toString() ? `/verification-requests?${qs.toString()}` : '/verification-requests';
  const res = await apiFetch(path, { method: 'GET' }, token);
  const raw = (await res.json()) as ApiEnvelope<VerificationRequestRow[]> & { message?: string; error?: string };
  return { res, result: { data: raw.data ?? [], error: raw.error || raw.message } };
}

export async function createVerificationRequest(
  token: string | null,
  payload: {
    goal_id: string;
    action_plan_id?: string | null;
    template_id?: string | null;
    scope: string;
    evidence_links: string[];
    member_notes?: string | null;
    rubric_snapshot?: unknown;
  }
) {
  const res = await apiFetch(
    '/verification-requests',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    token
  );
  const raw = (await res.json()) as ApiEnvelope<VerificationRequestRow> & { message?: string; error?: string };
  return { res, result: { data: raw.data, error: raw.error || raw.message } };
}

export async function fetchVerificationRequestById(token: string | null, requestId: string) {
  const res = await apiFetch(`/verification-requests/${requestId}`, { method: 'GET' }, token);
  const raw = (await res.json()) as ApiEnvelope<VerificationRequestRow> & { message?: string; error?: string };
  return { res, result: { data: raw.data, error: raw.error || raw.message } };
}

export async function reviewVerificationRequest(
  token: string | null,
  requestId: string,
  payload: { result: 'Pass' | 'NeedsWork' | 'Fail'; scores: Record<string, unknown>; leader_feedback?: string }
) {
  const res = await apiFetch(
    `/verification-requests/${requestId}/review`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    token
  );
  const raw = (await res.json()) as ApiEnvelope<{ review: unknown }> & { message?: string; error?: string };
  return { res, result: { data: raw.data, error: raw.error || raw.message } };
}


