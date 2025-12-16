import { apiFetch } from '../common/api';
import { API_PATHS } from './paths';

type ApiEnvelope<T> = { data: T; error?: string };

export type LeaderUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  team?: string | null;
  role?: string | null;
};

export async function fetchLeaderUsers(
  token: string | null,
  params: { q?: string; team?: string; limit?: number; offset?: number } = {}
) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.team) qs.set('team', params.team);
  if (typeof params.limit === 'number') qs.set('limit', String(params.limit));
  if (typeof params.offset === 'number') qs.set('offset', String(params.offset));

  const path = qs.toString() ? `${API_PATHS.leaderUsers}?${qs.toString()}` : API_PATHS.leaderUsers;
  const res = await apiFetch(path, { method: 'GET' }, token);
  const raw = (await res.json()) as ApiEnvelope<LeaderUser[]> & { message?: string; error?: string };
  return { res, result: { data: raw.data ?? [], error: raw.error || raw.message } };
}


