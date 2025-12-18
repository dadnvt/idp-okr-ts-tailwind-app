import { apiFetch } from '../common/api';
import { API_PATHS } from './paths';

type ApiEnvelope<T> = { data: T; error?: string };

export type LeaderTeam = { id: string; name: string };

export async function fetchLeaderTeams(token: string | null) {
  const res = await apiFetch(API_PATHS.leaderTeams, { method: 'GET' }, token);
  const raw = (await res.json()) as ApiEnvelope<LeaderTeam[]> & { message?: string; error?: string };
  return { res, result: { data: raw.data ?? [], error: raw.error || raw.message } };
}


