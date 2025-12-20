import { useEffect, useMemo, useState } from 'react';
import Dropdown from '../Dropdown';
import { InfoLabel } from '../Tooltip';
import { useAuth } from '../../common/AuthContext';
import {
  fetchManagerMemberInsights,
  fetchManagerOverview,
  fetchManagerTeams,
  fetchManagerTeamMembersSummary,
  fetchManagerTeamMembersTrends,
  fetchManagerUsers,
  type ManagerTeam,
  type ManagerUser,
  type ManagerTeamMemberSummary,
  type ManagerTeamMembersTrends,
  type ManagerOverview,
} from '../../api/managerApi';
import SimpleBarChart from '../charts/SimpleBarChart';
import SimpleLineChart from '../charts/SimpleLineChart';

function currentYear() {
  return new Date().getFullYear();
}

export default function ManagerDashboard() {
  const { auth } = useAuth();

  const [year, setYear] = useState(String(currentYear()));
  const [teams, setTeams] = useState<ManagerTeam[]>([]);
  const [teamId, setTeamId] = useState<string>('');
  const [users, setUsers] = useState<ManagerUser[]>([]);
  const [userId, setUserId] = useState<string>('');

  const [overview, setOverview] = useState<ManagerOverview | null>(null);
  const [teamSummary, setTeamSummary] = useState<ManagerTeamMemberSummary | null>(null);
  const [teamTrends, setTeamTrends] = useState<ManagerTeamMembersTrends | null>(null);
  const [memberInsights, setMemberInsights] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const yearNum = useMemo(() => Number(year), [year]);

  // Load teams
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { res, result } = await fetchManagerTeams(auth.token);
      if (cancelled) return;
      if (!res.ok) {
        setErr(result.error || result.message || 'Failed to load teams');
        return;
      }
      setTeams(result.data || []);
    })().catch((e) => setErr(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [auth.token]);

  // Load users for selected team (cascading)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!teamId) {
        setUsers([]);
        setUserId('');
        return;
      }
      const { res, result } = await fetchManagerUsers(auth.token, { teamId, limit: 1000, offset: 0 });
      if (cancelled) return;
      if (!res.ok) {
        setErr(result.error || result.message || 'Failed to load users');
        return;
      }
      setUsers(result.data || []);
    })().catch((e) => setErr(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [auth.token, teamId]);

  // Load overview + optional member insights
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      setMemberInsights(null);
      setTeamSummary(null);
      setTeamTrends(null);

      if (!yearNum || Number.isNaN(yearNum)) {
        setLoading(false);
        setErr('Year is invalid');
        return;
      }

      // Fetch in parallel (reduces perceived lag vs sequential awaits)
      const reqs: Array<{ key: string; run: () => Promise<any> }> = [
        {
          key: 'overview',
          run: () =>
            fetchManagerOverview(auth.token, {
              year: yearNum,
              teamId: teamId || undefined,
              weeks: 8,
            }),
        },
      ];

      if (teamId) {
        reqs.push({
          key: 'teamSummary',
          run: () => fetchManagerTeamMembersSummary(auth.token, { year: yearNum, teamId, weeks: 8 }),
        });
        reqs.push({
          key: 'teamTrends',
          run: () => fetchManagerTeamMembersTrends(auth.token, { year: yearNum, teamId, weeks: 8 }),
        });
      }

      if (userId) {
        reqs.push({
          key: 'memberInsights',
          run: () => fetchManagerMemberInsights(auth.token, { year: yearNum, userId, weeks: 8 }),
        });
      }

      const settled = await Promise.allSettled(reqs.map((r) => r.run()));
      if (cancelled) return;

      let firstErr: string | null = null;

      for (let i = 0; i < settled.length; i++) {
        const key = reqs[i].key;
        const s = settled[i];
        if (s.status === 'rejected') {
          firstErr = firstErr || (s.reason instanceof Error ? s.reason.message : String(s.reason));
          continue;
        }
        const { res, result } = s.value as { res: Response; result: any };
        if (!res.ok) {
          firstErr = firstErr || result?.error || result?.message || `Failed to load ${key}`;
          continue;
        }
        if (key === 'overview') setOverview(result.data);
        if (key === 'teamSummary') setTeamSummary(result.data);
        if (key === 'teamTrends') setTeamTrends(result.data);
        if (key === 'memberInsights') setMemberInsights(result.data);
      }

      if (firstErr) setErr(firstErr);
      setLoading(false);
    })().catch((e) => {
      if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [auth.token, yearNum, teamId, userId]);

  const teamOptions = useMemo(() => {
    return [{ id: '', label: 'All teams' }, ...teams.map((t) => ({ id: t.id, label: t.name }))];
  }, [teams]);

  const userOptions = useMemo(() => {
    return [
      { id: '', label: 'All members' },
      ...users.map((u) => ({
        id: u.id,
        label: `${u.name || u.email || u.id}`,
      })),
    ];
  }, [users]);

  const years = useMemo(() => {
    const y = currentYear();
    return [String(y - 1), String(y), String(y + 1)];
  }, []);

  const org = overview?.org as any;
  const teamMembers = teamSummary?.members || [];
  const fmtPct = (x: unknown) => (typeof x === 'number' ? `${Math.round(x * 100)}%` : '-');

  const teamActiveLabels = (overview as any)?.trends?.weeks?.map?.((w: any) => w.week) || [];
  const teamActiveValues =
    (overview as any)?.trends?.weeks?.map?.((w: any) => (typeof w.active_rate === 'number' ? w.active_rate : 0)) || [];

  const selectedMemberSeries = useMemo(() => {
    if (!userId || !teamTrends) return null;
    const m = (teamTrends.members || []).find((x) => x.user_id === userId);
    if (!m) return null;
    return { labels: teamTrends.weeks || [], values: m.reports_by_week || [], name: m.name || m.email || m.user_id };
  }, [userId, teamTrends]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Manager Dashboard</h1>
          {loading ? <div className="text-sm text-gray-500">Loading…</div> : null}
        </div>

        <div className="mt-4 p-4 bg-white rounded-xl border">
          <div className="flex flex-wrap gap-4 items-end">
            <Dropdown label="Year" value={year} options={years} onChange={(v) => setYear(v)} />
            <Dropdown
              label="Team"
              value={teamId}
              options={teamOptions}
              onChange={(v) => {
                setTeamId(v);
                setUserId(''); // cascade reset
              }}
            />
            <Dropdown
              label="Member"
              value={userId}
              options={userOptions}
              onChange={(v) => setUserId(v)}
              disabled={!teamId}
            />
          </div>
          {err ? <div className="mt-3 text-sm text-red-600">{err}</div> : null}
        </div>

        {/* Org / Team overview cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-500">
              <InfoLabel
                label="Members"
                tooltip="Total members in the selected scope (org-wide if Team=All, otherwise the selected team)."
              />
            </div>
            <div className="text-2xl font-semibold text-gray-900">{org?.members_total ?? '-'}</div>
            <div className="mt-1 text-sm text-gray-600">
              <InfoLabel
                label={
                  <>
                    With goals: {org?.members_with_goal ?? '-'} / {org?.members_total ?? '-'}
                  </>
                }
                tooltip="How many members have at least 1 goal in the selected Year. This is a quick adoption/coverage signal."
                className="text-gray-600"
              />
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-500">
              <InfoLabel
                label="Goals"
                tooltip="Total goals for the selected Year in the current scope."
              />
            </div>
            <div className="text-2xl font-semibold text-gray-900">{org?.goals_total ?? '-'}</div>
            <div className="mt-1 text-sm text-gray-600">
              <InfoLabel
                label={
                  <>
                    Approved: {org?.goals_review?.approved ?? '-'} · Pending: {org?.goals_review?.pending ?? '-'}
                  </>
                }
                tooltip="Leader review status of goals. Pending means not reviewed yet (or still waiting)."
                className="text-gray-600"
              />
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-500">
              <InfoLabel
                label="Progress"
                tooltip="Average goal progress (%) across goals in the selected scope/year."
              />
            </div>
            <div className="text-2xl font-semibold text-gray-900">{org?.progress_avg ?? '-'}</div>
            <div className="mt-1 text-sm text-gray-600">
              <InfoLabel
                label={<>Delta (this vs prev week): {org?.progress_delta ?? '-'}</>}
                tooltip="Average change in progress (percentage points) compared to previous week. Requires goal_progress_history snapshots."
                className="text-gray-600"
              />
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-500">
              <InfoLabel
                label="Execution"
                tooltip="Delivery/discipline indicators from action plans and weekly activity."
              />
            </div>
            <div className="text-2xl font-semibold text-gray-900">{org?.action_plans?.overdue ?? '-'}</div>
            <div className="mt-1 text-sm text-gray-600">
              <InfoLabel
                label="Overdue action plans"
                tooltip="Count of action plans past end_date and not Completed."
                className="text-gray-600"
              />
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-500">
              <InfoLabel
                label="Evidence rate"
                tooltip="Among Completed action plans, the % that have an evidence_link filled."
              />
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {typeof org?.action_plans?.evidence_rate === 'number'
                ? `${Math.round(org.action_plans.evidence_rate * 100)}%`
                : '-'}
            </div>
            <div className="mt-1 text-sm text-gray-600">
              <InfoLabel
                label="Completed plans with evidence"
                tooltip="Evidence is typically a link to repo, screenshot, cert, recording, meeting notes, etc."
                className="text-gray-600"
              />
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-500">
              <InfoLabel
                label="Verification"
                tooltip="Verification requests submitted by members for the selected Year/scope."
              />
            </div>
            <div className="text-2xl font-semibold text-gray-900">{org?.verifications?.pending ?? '-'}</div>
            <div className="mt-1 text-sm text-gray-600">
              <InfoLabel
                label={<>Pending · Reviewed: {org?.verifications?.reviewed ?? '-'}</>}
                tooltip="Pending = waiting for leader review. Reviewed = already scored/feedback given."
                className="text-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Team growth summary (only when a team is selected) */}
        {teamId ? (
          <div className="mt-6 bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-800">
                <InfoLabel
                  label="Team growth signals"
                  tooltip="Highlights the strongest signals inside the selected team to quickly spot who is progressing, executing, and staying active."
                />
              </div>
              <div className="text-xs text-gray-500">
                Window: {teamSummary?.window?.from ?? '-'} → {teamSummary?.window?.to ?? '-'}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 border rounded-xl p-4">
                <div className="text-sm text-gray-500">
                  <InfoLabel
                    label="Activity (streak)"
                    tooltip="Consecutive weeks with at least 1 weekly report. Higher = better consistency."
                  />
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  Top streaks:{' '}
                  {(teamSummary as any)?.top?.activity_streak?.slice?.(0, 3)?.map?.((m: any) => (
                    <span key={m.user_id} className="mr-2">
                      <span className="font-medium">{m.name || m.email || m.user_id}</span> ({m.weekly_reports?.streak_weeks ?? 0}w)
                    </span>
                  )) || <span>-</span>}
                </div>
              </div>
              <div className="bg-gray-50 border rounded-xl p-4">
                <div className="text-sm text-gray-500">
                  <InfoLabel
                    label="Evidence rate"
                    tooltip="Among Completed action plans for each member, what % has evidence_link. Higher = better proof-of-work."
                  />
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  Top evidence:{' '}
                  {(teamSummary as any)?.top?.evidence_rate?.slice?.(0, 3)?.map?.((m: any) => (
                    <span key={m.user_id} className="mr-2">
                      <span className="font-medium">{m.name || m.email || m.user_id}</span> ({fmtPct(m.action_plans?.evidence_rate)})
                    </span>
                  )) || <span>-</span>}
                </div>
              </div>
              <div className="bg-gray-50 border rounded-xl p-4">
                <div className="text-sm text-gray-500">
                  <InfoLabel
                    label="Progress delta"
                    tooltip="Average progress change vs previous week. Requires goal_progress_history snapshots."
                  />
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  Top deltas:{' '}
                  {(teamSummary as any)?.top?.progress_delta?.slice?.(0, 3)?.map?.((m: any) => (
                    <span key={m.user_id} className="mr-2">
                      <span className="font-medium">{m.name || m.email || m.user_id}</span> ({m.progress_delta ?? 0})
                    </span>
                  )) || <span>-</span>}
                </div>
              </div>
            </div>

            {/* Member table */}
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-2 pr-4">
                      <InfoLabel label="Member" tooltip="Member name/email in the selected team." />
                    </th>
                    <th className="py-2 pr-4">
                      <InfoLabel
                        label="Goals"
                        tooltip="Total goals in the selected Year. A=Approved, P=Pending review."
                      />
                    </th>
                    <th className="py-2 pr-4">
                      <InfoLabel
                        label="Avg progress"
                        tooltip="Average progress (%) across the member's goals for the selected Year."
                      />
                    </th>
                    <th className="py-2 pr-4">
                      <InfoLabel
                        label="Δ progress"
                        tooltip="Average progress change (percentage points) vs previous week. Requires goal_progress_history."
                      />
                    </th>
                    <th className="py-2 pr-4">
                      <InfoLabel
                        label="Overdue plans"
                        tooltip="Action plans past end_date and not Completed. High values indicate execution risk."
                      />
                    </th>
                    <th className="py-2 pr-4">
                      <InfoLabel
                        label="Evidence"
                        tooltip="Evidence rate for Completed action plans (Completed_with_evidence / Completed)."
                      />
                    </th>
                    <th className="py-2 pr-4">
                      <InfoLabel
                        label="Streak"
                        tooltip="Consecutive weeks with weekly reports. 0w means no reports in the current window."
                      />
                    </th>
                    <th className="py-2 pr-4">
                      <InfoLabel
                        label="Verify pending"
                        tooltip="Verification requests waiting for leader review for the selected Year."
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  {teamMembers.map((m: any) => (
                    <tr key={m.user_id} className="border-t">
                      <td className="py-2 pr-4">
                        <div className="font-medium">{m.name || m.email || m.user_id}</div>
                        {m.email ? <div className="text-xs text-gray-500">{m.email}</div> : null}
                      </td>
                      <td className="py-2 pr-4">
                        {m.goals?.total ?? 0} <span className="text-xs text-gray-500">(A:{m.goals?.approved ?? 0} P:{m.goals?.pending ?? 0})</span>
                      </td>
                      <td className="py-2 pr-4">{m.goals?.progress_avg ?? 0}</td>
                      <td className="py-2 pr-4">{m.progress_delta ?? '-'}</td>
                      <td className="py-2 pr-4">{m.action_plans?.overdue ?? 0}</td>
                      <td className="py-2 pr-4">{fmtPct(m.action_plans?.evidence_rate)}</td>
                      <td className="py-2 pr-4">{m.weekly_reports?.streak_weeks ?? 0}w</td>
                      <td className="py-2 pr-4">{m.verifications?.pending ?? 0}</td>
                    </tr>
                  ))}
                  {teamMembers.length === 0 ? (
                    <tr>
                      <td className="py-3 text-gray-500" colSpan={8}>
                        No members found for this team.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Trend charts */}
        {teamId ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SimpleBarChart
              title="Team weekly active rate"
              subtitle="Members with ≥1 weekly report / total members"
              labels={teamActiveLabels}
              values={teamActiveValues}
              valueFormatter={(v) => `${Math.round(v * 100)}%`}
            />

            <SimpleLineChart
              title={selectedMemberSeries ? `Member weekly activity — ${selectedMemberSeries.name}` : 'Member weekly activity'}
              subtitle={selectedMemberSeries ? 'Weekly report count by week' : 'Select a Member to see their trend'}
              labels={selectedMemberSeries?.labels || teamTrends?.weeks || []}
              values={selectedMemberSeries?.values || []}
              valueFormatter={(v) => `${v} report(s)`}
            />
          </div>
        ) : null}

        {/* Per-team table (only when viewing org) */}
        {!teamId ? (
          <div className="mt-6 bg-white border rounded-xl p-4">
            <div className="font-semibold text-gray-800">
              <InfoLabel
                label="Teams overview"
                tooltip="Compare teams quickly. If you want to drill down, select a team above to see per-member details."
              />
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-2 pr-4">
                      <InfoLabel label="Team" tooltip="Team name." />
                    </th>
                    <th className="py-2 pr-4">
                      <InfoLabel label="Members" tooltip="Total members in that team." />
                    </th>
                    <th className="py-2 pr-4">
                      <InfoLabel label="With goals" tooltip="Members who have at least 1 goal in the selected Year." />
                    </th>
                    <th className="py-2 pr-4">
                      <InfoLabel label="Goals" tooltip="Total goals in that team for the selected Year." />
                    </th>
                    <th className="py-2 pr-4">
                      <InfoLabel label="Avg progress" tooltip="Average progress (%) across goals in that team." />
                    </th>
                    <th className="py-2 pr-4">
                      <InfoLabel
                        label="Active rate (week)"
                        tooltip="% members with at least 1 weekly report during the current week (based on weekly_reports)."
                      />
                    </th>
                    <th className="py-2 pr-4">
                      <InfoLabel label="Overdue plans" tooltip="Count of overdue action plans in that team." />
                    </th>
                    <th className="py-2 pr-4">
                      <InfoLabel label="Pending verify" tooltip="Verification requests pending review in that team." />
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  {(overview?.per_team || []).map((t: any) => (
                    <tr key={t.team_id} className="border-t">
                      <td className="py-2 pr-4 font-medium">{t.team_name}</td>
                      <td className="py-2 pr-4">{t.members_total ?? 0}</td>
                      <td className="py-2 pr-4">{t.members_with_goal ?? 0}</td>
                      <td className="py-2 pr-4">{t.goals_total ?? 0}</td>
                      <td className="py-2 pr-4">{t.progress_avg ?? 0}</td>
                      <td className="py-2 pr-4">
                        {typeof t.weekly_reports?.active_rate_this_week === 'number'
                          ? `${Math.round(t.weekly_reports.active_rate_this_week * 100)}%`
                          : '0%'}
                      </td>
                      <td className="py-2 pr-4">{t.action_plans?.overdue ?? 0}</td>
                      <td className="py-2 pr-4">{t.verifications?.pending ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Member view (when member selected) */}
        {userId ? (
          <div className="mt-6 bg-white border rounded-xl p-4">
            <div className="font-semibold text-gray-800">Member insights</div>
            {memberInsights ? (
              <>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 border rounded-xl p-4">
                    <div className="text-sm text-gray-500">Goals</div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {(memberInsights as any)?.goals?.total ?? '-'}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Approved: {(memberInsights as any)?.goals?.approved ?? '-'} · Pending:{' '}
                      {(memberInsights as any)?.goals?.pending ?? '-'}
                    </div>
                  </div>
                  <div className="bg-gray-50 border rounded-xl p-4">
                    <div className="text-sm text-gray-500">Action plans</div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {(memberInsights as any)?.action_plans?.total ?? '-'}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Overdue: {(memberInsights as any)?.action_plans?.overdue ?? '-'} · Evidence:{' '}
                      {typeof (memberInsights as any)?.action_plans?.evidence_rate === 'number'
                        ? `${Math.round(((memberInsights as any)?.action_plans?.evidence_rate ?? 0) * 100)}%`
                        : '-'}
                    </div>
                  </div>
                  <div className="bg-gray-50 border rounded-xl p-4">
                    <div className="text-sm text-gray-500">Weekly activity</div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {(memberInsights as any)?.weekly_reports?.streak_weeks ?? '-'}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Streak weeks · Progress delta: {(memberInsights as any)?.progress_delta ?? '-'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-3 text-sm text-gray-500">No member insights yet</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}


