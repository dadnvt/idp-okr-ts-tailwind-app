import { FaBullseye, FaClipboardList, FaUsers } from 'react-icons/fa';
import ReviewGoalModal from './ReviewGoalModal';
import { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import type { IGoal } from '../../types';
import Sidebar from '../Sidebar';
import StatsCard from '../StatsCard';
import { useAuth } from '../../common/AuthContext';
import LeaderGoalCard from './LeaderGoalCard';
import { fetchLeaderGoals, fetchLeaderWeeklyReportStats, reviewLeaderGoal, type LeaderWeeklyReportStats } from '../../api/leaderApi';
import { fetchLeaderUsers, type LeaderUser } from '../../api/usersApi';
import Dropdown from '../Dropdown';
import { endOfWeekMonday, parseDateOnly, startOfWeekMonday, toDateOnly } from '../../common/Utility';
import { Button } from '../Button';
import { YEAR_OPTIONS } from '../../common/constants';

export default function LeaderDashboard() {
  const { auth } = useAuth();
  const [goals, setGoals] = useState<IGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<IGoal | null>(null);
  const [reviewGoal, setReviewGoal] = useState<IGoal | null>(null);
  const [goalStatusFilter, setGoalStatusFilter] = useState<string>('All');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('All');
  const [leaderUsers, setLeaderUsers] = useState<LeaderUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [showInsights, setShowInsights] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [hasMoreGoals, setHasMoreGoals] = useState(true);
  const [weeklyReportStats, setWeeklyReportStats] = useState<LeaderWeeklyReportStats | null>(null);
  const [isLoadingWeeklyStats, setIsLoadingWeeklyStats] = useState(false);
  const pageLimit = 10;

  useEffect(() => {
    const loadUsers = async () => {
      if (!auth.token) return;
      try {
        const { res, result } = await fetchLeaderUsers(auth.token, { limit: 500, offset: 0 });
        if (!res.ok) throw new Error(result.error || 'Fetch users failed');
        setLeaderUsers(result.data);
      } catch (e) {
        console.error(e);
        setLeaderUsers([]);
      }
    };
    loadUsers();
  }, [auth.token]);


  useEffect(() => {
    const fetchFirstPage = async () => {
      if (!auth.token) return;
      setIsLoadingGoals(true);
      try {
        const userId = selectedUserId !== 'All' ? selectedUserId : undefined;
        const { result } = await fetchLeaderGoals(auth.token, {
          year: selectedYear,
          userId,
          limit: pageLimit,
          offset: 0,
        });
        setGoals(result.data);
        setHasMoreGoals((result.data || []).length === pageLimit);
      } finally {
        setIsLoadingGoals(false);
      }
    };
    fetchFirstPage();
  }, [auth.token, selectedYear, selectedUserId]);

  const loadMoreGoals = async () => {
    if (!auth.token) return;
    if (isLoadingGoals) return;
    if (!hasMoreGoals) return;
    setIsLoadingGoals(true);
    try {
      const offset = goals.length;
      const userId = selectedUserId !== 'All' ? selectedUserId : undefined;
      const { result } = await fetchLeaderGoals(auth.token, { year: selectedYear, userId, limit: pageLimit, offset });
      const next = result.data || [];
      setGoals((prev) => {
        const seen = new Set(prev.map((g) => g.id));
        const merged = [...prev];
        for (const g of next) if (!seen.has(g.id)) merged.push(g);
        return merged;
      });
      setHasMoreGoals(next.length === pageLimit);
    } finally {
      setIsLoadingGoals(false);
    }
  };

  const GOAL_STATUS_OPTIONS = ['All', 'Draft', 'In Progress', 'Completed', 'Cancelled', 'Not started'] as const;
  const REVIEW_STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'] as const;
  const TEAM_OPTIONS = [
    'All',
    ...Array.from(
      new Set(
        goals
          .map((g) => g.team)
          .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      )
    ).sort(),
  ] as const;

  const visibleGoals = goals
    .filter((g) => (goalStatusFilter === 'All' ? true : g.status === goalStatusFilter))
    .filter((g) =>
      reviewStatusFilter === 'All'
        ? true
        : (g.review_status || 'Cancelled') === reviewStatusFilter
    );

  const visibleGoalsWithMemberTeam = visibleGoals
    .filter((g) => (teamFilter === 'All' ? true : (g.team || '') === teamFilter))
    ;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // "This week" window (Mon → Sun) used for missing weekly report insight
  const weekStart = startOfWeekMonday(now);
  const weekEnd = endOfWeekMonday(now);
  const weekFrom = toDateOnly(weekStart);
  const weekTo = toDateOnly(weekEnd);
  const weekLabel = `${toDateOnly(weekStart)} → ${toDateOnly(weekEnd)}`;

  // Load weekly report stats for last week (leader insights)
  useEffect(() => {
    const load = async () => {
      if (!auth.token) return;
      setIsLoadingWeeklyStats(true);
      try {
        const userId = selectedUserId !== 'All' ? selectedUserId : undefined;
        const { res, result } = await fetchLeaderWeeklyReportStats(auth.token, {
          year: selectedYear,
          userId,
          from: weekFrom,
          to: weekTo,
        });
        if (!res.ok) throw new Error((result as any)?.error || 'Fetch weekly report stats failed');
        setWeeklyReportStats(result.data || {});
      } catch (e) {
        console.error(e);
        setWeeklyReportStats({});
      } finally {
        setIsLoadingWeeklyStats(false);
      }
    };
    load();
  }, [auth.token, selectedYear, selectedUserId, weekFrom, weekTo]);

  const overdueGoals = goals.filter((g) => {
    if (!g.time_bound) return false;
    const deadline = parseDateOnly(g.time_bound);
    const isOverdue = deadline.getTime() < todayStart.getTime();
    const status = g.status || '';
    return isOverdue && status !== 'Completed' && status !== 'Cancelled';
  });

  const overdueActionPlans = goals.flatMap((g) =>
    (g.action_plans || []).flatMap((p) => {
      if (!p.end_date) return [];
      const end = parseDateOnly(p.end_date);
      const isOverdue = end.getTime() < todayStart.getTime();
      const status = p.status || '';
      if (!isOverdue) return [];
      if (status === 'Completed') return [];
      return [
        {
          goal: g,
          plan: p,
        },
      ];
    })
  );

  const missingWeeklyReportsThisWeek = goals.flatMap((g) =>
    (g.action_plans || []).flatMap((p) => {
      const goalStatus = g.status || '';
      const planStatus = p.status || '';
      if (goalStatus !== 'In Progress') return [];
      if (!(planStatus === 'In Progress' || planStatus === 'Blocked')) return [];

      // Avoid flagging plans that start after this week ended
      if (p.start_date) {
        const start = parseDateOnly(p.start_date);
        if (start.getTime() > weekEnd.getTime()) return [];
      }

      // Stats are fetched from backend (weekly_reports are not embedded in leader goals payload).
      const stat = weeklyReportStats?.[p.id];
      if (!stat) return [];
      const hasReportThisWeek = stat.hasReportInRange;

      if (hasReportThisWeek) return [];

      return [
        {
          goal: g,
          plan: p,
          lastReportDate: stat.lastReportDate || null,
        },
      ];
    })
  );

  const pendingDeadlineChangeRequests = goals.flatMap((g) =>
    (g.action_plans || []).flatMap((p) => {
      if (!p.request_deadline_date) return [];
      if (p.review_status !== 'Pending') return [];
      return [
        {
          goal: g,
          plan: p,
          currentDeadline: p.end_date,
          requestedDeadline: p.request_deadline_date,
          count: p.deadline_change_count || 0,
        },
      ];
    })
  );

  const totalGoals = goals.length;
  const approved = goals.filter(g => g.review_status === 'Approved').length;
  const pending = goals.filter(g => !g.review_status || g.review_status === 'Pending').length;
  const avgProgress =
    totalGoals > 0
      ? goals.reduce((s, g) => s + g.progress, 0) / totalGoals
      : 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-4xl font-extrabold mb-2">
          Leader Dashboard
        </h1>
        <p className="text-xl text-gray-500 mb-10">
          Follow & reivew goals of team 👥
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <StatsCard title="Goals to review" stat={pending} icon={FaBullseye} />
          <StatsCard title="Goals approved" stat={approved} icon={FaClipboardList} />
          <StatsCard title="Avg progress" stat={`${avgProgress.toFixed(1)}%`} icon={FaUsers} />
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Leader Insights</h2>
            <Button variant="secondary" size="sm" onClick={() => setShowInsights((v) => !v)}>
              {showInsights ? 'Hide' : 'Show'}
            </Button>
          </div>

          {showInsights && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-white rounded-xl border">
                <p className="text-sm text-gray-500">Overdue goals</p>
                <p className="text-2xl font-bold text-red-600">{overdueGoals.length}</p>
              </div>
              <div className="p-4 bg-white rounded-xl border">
                <p className="text-sm text-gray-500">Overdue action plans</p>
                <p className="text-2xl font-bold text-red-600">{overdueActionPlans.length}</p>
              </div>
              <div className="p-4 bg-white rounded-xl border">
                <p className="text-sm text-gray-500">Missing weekly report (this week)</p>
                <p className="text-xs text-gray-400">{weekLabel}</p>
                <p className="text-2xl font-bold text-orange-600">
                  {isLoadingWeeklyStats ? '…' : missingWeeklyReportsThisWeek.length}
                </p>
              </div>
            </div>
          )}

          {showInsights && (
            <div className="mt-6 space-y-6">
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold">Pending deadline change requests</h3>
                  <p className="text-xs text-gray-500">Action plans pending review with requested deadline change</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left">Member</th>
                        <th className="p-3 text-left">Team</th>
                        <th className="p-3 text-left">Goal</th>
                        <th className="p-3 text-left">Action Plan</th>
                        <th className="p-3 text-left">Current</th>
                        <th className="p-3 text-left">Requested</th>
                        <th className="p-3 text-left">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingDeadlineChangeRequests.slice(0, 10).map((x) => (
                        <tr key={x.plan.id} className="border-t">
                          <td className="p-3">{x.goal.user_name || x.goal.user_email}</td>
                          <td className="p-3">{x.goal.team || '-'}</td>
                          <td className="p-3">{x.goal.name}</td>
                          <td className="p-3">{x.plan.activity}</td>
                          <td className="p-3">{x.currentDeadline}</td>
                          <td className="p-3">
                            <span className="font-semibold text-blue-700">{x.requestedDeadline}</span>
                          </td>
                          <td className="p-3">{x.count}/3</td>
                        </tr>
                      ))}
                      {pendingDeadlineChangeRequests.length === 0 && (
                        <tr>
                          <td className="p-3 text-gray-500 italic" colSpan={7}>
                            No pending deadline change requests.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {pendingDeadlineChangeRequests.length > 10 && (
                  <div className="px-4 py-3 text-xs text-gray-500 border-t">
                    Showing 10/{pendingDeadlineChangeRequests.length}. Narrow using Team/Search filters above.
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold">Missing weekly report (this week)</h3>
                  <p className="text-xs text-gray-500">{weekLabel}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left">Member</th>
                        <th className="p-3 text-left">Team</th>
                        <th className="p-3 text-left">Goal</th>
                        <th className="p-3 text-left">Action Plan</th>
                        <th className="p-3 text-left">Plan status</th>
                        <th className="p-3 text-left">Last report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missingWeeklyReportsThisWeek.slice(0, 10).map((x) => (
                        <tr key={x.plan.id} className="border-t">
                          <td className="p-3">{x.goal.user_name || x.goal.user_email}</td>
                          <td className="p-3">{x.goal.team || '-'}</td>
                          <td className="p-3">{x.goal.name}</td>
                          <td className="p-3">{x.plan.activity}</td>
                          <td className="p-3">{x.plan.status}</td>
                          <td className="p-3">{x.lastReportDate || 'Never'}</td>
                        </tr>
                      ))}
                      {isLoadingWeeklyStats && (
                        <tr>
                          <td className="p-3 text-gray-500 italic" colSpan={6}>
                            Loading weekly report stats…
                          </td>
                        </tr>
                      )}
                      {!isLoadingWeeklyStats && missingWeeklyReportsThisWeek.length === 0 && (
                        <tr>
                          <td className="p-3 text-gray-500 italic" colSpan={6}>
                            No missing reports detected.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {missingWeeklyReportsThisWeek.length > 10 && (
                  <div className="px-4 py-3 text-xs text-gray-500 border-t">
                    Showing 10/{missingWeeklyReportsThisWeek.length}. Narrow using Team/Search filters above.
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold">Overdue action plans</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left">Member</th>
                        <th className="p-3 text-left">Team</th>
                        <th className="p-3 text-left">Goal</th>
                        <th className="p-3 text-left">Action Plan</th>
                        <th className="p-3 text-left">End date</th>
                        <th className="p-3 text-left">Plan status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueActionPlans.slice(0, 10).map((x) => (
                        <tr key={x.plan.id} className="border-t">
                          <td className="p-3">{x.goal.user_name || x.goal.user_email}</td>
                          <td className="p-3">{x.goal.team || '-'}</td>
                          <td className="p-3">{x.goal.name}</td>
                          <td className="p-3">{x.plan.activity}</td>
                          <td className="p-3">{x.plan.end_date}</td>
                          <td className="p-3">{x.plan.status}</td>
                        </tr>
                      ))}
                      {overdueActionPlans.length === 0 && (
                        <tr>
                          <td className="p-3 text-gray-500 italic" colSpan={6}>
                            No overdue action plans.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {overdueActionPlans.length > 10 && (
                  <div className="px-4 py-3 text-xs text-gray-500 border-t">
                    Showing 10/{overdueActionPlans.length}. Narrow using Team/Search filters above.
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold">Overdue goals</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left">Member</th>
                        <th className="p-3 text-left">Team</th>
                        <th className="p-3 text-left">Goal</th>
                        <th className="p-3 text-left">Deadline</th>
                        <th className="p-3 text-left">Goal status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueGoals.slice(0, 10).map((g) => (
                        <tr key={g.id} className="border-t">
                          <td className="p-3">{g.user_name || g.user_email}</td>
                          <td className="p-3">{g.team || '-'}</td>
                          <td className="p-3">{g.name}</td>
                          <td className="p-3">{g.time_bound}</td>
                          <td className="p-3">{g.status}</td>
                        </tr>
                      ))}
                      {overdueGoals.length === 0 && (
                        <tr>
                          <td className="p-3 text-gray-500 italic" colSpan={5}>
                            No overdue goals.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {overdueGoals.length > 10 && (
                  <div className="px-4 py-3 text-xs text-gray-500 border-t">
                    Showing 10/{overdueGoals.length}. Narrow using Team/Search filters above.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-6 mb-6 flex-wrap gap-y-2">
          <Dropdown
            label="Year"
            value={selectedYear}
            options={YEAR_OPTIONS}
            onChange={(v) => setSelectedYear(Number(v))}
          />
          <Dropdown
            label="Goal Status"
            value={goalStatusFilter}
            options={[...GOAL_STATUS_OPTIONS]}
            onChange={setGoalStatusFilter}
          />
          <Dropdown
            label="Review Status"
            value={reviewStatusFilter}
            options={[...REVIEW_STATUS_OPTIONS]}
            onChange={setReviewStatusFilter}
          />
          <Dropdown
            label="Team"
            value={teamFilter}
            options={[...TEAM_OPTIONS] as unknown as string[]}
            onChange={setTeamFilter}
          />
          <Dropdown
            label="Member"
            value={selectedUserId}
            options={[
              { id: 'All', label: 'All members' },
              ...leaderUsers.map((u) => ({
                id: u.id,
                label: `${u.name || u.email || u.id}${u.team ? ` • ${u.team}` : ''}`,
              })),
            ]}
            onChange={(v) => setSelectedUserId(String(v))}
          />
        </div>

        {/* Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleGoalsWithMemberTeam.map(goal => (
            <LeaderGoalCard
              key={goal.id}
              goal={goal}
              onReviewClick={setReviewGoal}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="text-xs text-gray-500">
            Loaded: {goals.length} goals{isLoadingGoals ? ' (loading...)' : ''}
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasMoreGoals || isLoadingGoals}
            onClick={loadMoreGoals}
          >
            {hasMoreGoals ? 'Load more' : 'No more'}
          </Button>
        </div>

        {/* Detail modal */}
        {selectedGoal && (
          <Modal
            isOpen
            title="Detail Goal"
            onClose={() => setSelectedGoal(null)}
          >
            <p><strong>Member:</strong> {selectedGoal.user_email}</p>
            <p><strong>Goal:</strong> {selectedGoal.name}</p>
            <p><strong>Progress:</strong> {selectedGoal.progress}%</p>
            <p><strong>Status:</strong> {selectedGoal.status}</p>
          </Modal>
        )}

        {/* Review modal */}
        {reviewGoal && (
          <ReviewGoalModal
            goal={reviewGoal}
            onClose={() => setReviewGoal(null)}
            onSubmit={async (review) => {
              await reviewLeaderGoal(auth.token, reviewGoal.id, review);

              setGoals(prev =>
                prev.map(g =>
                  g.id === reviewGoal.id
                    ? {
                      ...g,
                      review_status: review.status,
                      leader_review_notes: review.comment,
                      status:
                        review.status === 'Approved' && (g.status === 'Not started' || g.status === 'Draft')
                          ? 'In Progress'
                          : g.status,
                    }
                    : g
                )
              );
              setReviewGoal(null);
            }}
          />
        )}
      </main>
    </div>
  );
}