import { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from '../common/Modal';
import type { IActionPlan, IGoal, IWeeklyReport } from '../types';
import { ActionPlanDetail } from '../components/ActionPlanDetail';
import { CreateActionPlanForm } from '../components/CreateActionPlanForm';
import Dropdown from '../components/Dropdown';
import { useAuth } from '../common/AuthContext';
import { getActionPlanHealth, getGoalHealth } from '../common/Utility';
import { YEAR_OPTIONS } from '../common/constants';
import {
  cancelActionPlanReview,
  createActionPlan,
  fetchActionPlansByYear,
  requestActionPlanReview,
  updateActionPlan,
} from '../api/actionPlansApi';
import { fetchLeaderGoals, reviewLeaderActionPlan } from '../api/leaderApi';
import { fetchLeaderUsers, type LeaderUser } from '../api/usersApi';
import { fetchLeaderTeams, type LeaderTeam } from '../api/teamsApi';
import ReviewActionPlanModal from '../components/leader/ReviewActionPlanModal';
import WeeklyReportCreateModal from '../components/WeeklyReportCreateModal';
import { createWeeklyReport } from '../api/weeklyReportsApi';
import { Button } from '../components/Button';

export default function ActionPlansPage() {
  const { auth } = useAuth();
  const years = YEAR_OPTIONS;
  const [goals, setGoals] = useState<IGoal[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<IActionPlan | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedGoal, setSelectedGoal] = useState<IGoal | null>(null);
  const [reviewPlan, setReviewPlan] = useState<IActionPlan | null>(null);
  const [createWeeklyForPlan, setCreateWeeklyForPlan] = useState<IActionPlan | null>(null);
  const [weeklyReportRefreshKey, setWeeklyReportRefreshKey] = useState(0);
  const [lastCreatedWeeklyReport, setLastCreatedWeeklyReport] = useState<IWeeklyReport | null>(null);
  const [editPlanStatus, setEditPlanStatus] = useState<IActionPlan['status']>('Not started');
  const [editPlanEndDate, setEditPlanEndDate] = useState<string>('');
  const [goalStatusFilter, setGoalStatusFilter] = useState<string>('All');
  const [goalReviewFilter, setGoalReviewFilter] = useState<string>('All');
  const [teams, setTeams] = useState<LeaderTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('All');
  const [leaderUsers, setLeaderUsers] = useState<LeaderUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('All');
  const [planStatusFilter, setPlanStatusFilter] = useState<string>('All');
  const [planReviewFilter, setPlanReviewFilter] = useState<string>('All');
  const [query, setQuery] = useState<string>('');
  const lastFetchKeyRef = useRef<string | null>(null);

  const GOAL_STATUS_OPTIONS = ['All', 'Draft', 'In Progress', 'Completed', 'Cancelled', 'Not started'] as const;
  const REVIEW_STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'] as const;
  const PLAN_STATUS_OPTIONS = ['All', 'Not started', 'In Progress', 'Completed', 'Blocked'] as const;

  const fetchGoals = async () => {
    try {
      const token = auth.token;
      if (!token) return;

      if (auth.user?.role === 'leader') {
        const userId = selectedUserId !== 'All' ? selectedUserId : undefined;
        const teamId = selectedTeamId !== 'All' ? selectedTeamId : undefined;
        const { result } = await fetchLeaderGoals(token, { year: selectedYear, userId, teamId, limit: 500, offset: 0 });
        setGoals(result.data);
      } else {
        const { result } = await fetchActionPlansByYear(token, selectedYear);
        setGoals(result.data);
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
    }
  };

  const q = query.trim().toLowerCase();
  const hasPlanFilter =
    planStatusFilter !== 'All' || planReviewFilter !== 'All' || q.length > 0;

  const yearGoals = goals.filter((g) => g.year === selectedYear);
  const filteredGoals = yearGoals
    .filter((g) => (goalStatusFilter === 'All' ? true : g.status === goalStatusFilter))
    .filter((g) =>
      goalReviewFilter === 'All'
        ? true
        : (g.review_status || 'Cancelled') === goalReviewFilter
    )
    .filter((g) => {
      if (!q) return true;
      const hay = `${g.name || ''} ${g.user_name || ''} ${g.user_email || ''} ${g.team || ''}`.toLowerCase();
      return hay.includes(q);
    })
    .filter((g) => {
      if (!hasPlanFilter) return true;
      const visiblePlans =
        (g.action_plans || [])
          .filter((p) => (planStatusFilter === 'All' ? true : p.status === planStatusFilter))
          .filter((p) =>
            planReviewFilter === 'All'
              ? true
              : (p.review_status || 'Cancelled') === planReviewFilter
          )
          .filter((p) => {
            if (!q) return true;
            const hay = `${p.activity || ''}`.toLowerCase();
            return hay.includes(q);
          });
      return visiblePlans.length > 0;
    });

  useEffect(() => {
    if (!auth.token) return;

    // In React StrictMode (dev), effects can run twice on mount to surface side-effects.
    // Dedupe identical fetches for the same (token, year, team, member) key.
    const key = `${auth.token}:${selectedYear}:${auth.user?.role === 'leader' ? `${selectedTeamId}:${selectedUserId}` : 'na'}`;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;

    fetchGoals();
  }, [auth.token, auth.user?.role, selectedYear, selectedUserId, selectedTeamId]);

  // Leader: load teams for dropdown filter
  useEffect(() => {
    const loadTeams = async () => {
      if (auth.user?.role !== 'leader') return;
      if (!auth.token) return;
      try {
        const { res, result } = await fetchLeaderTeams(auth.token);
        if (!res.ok) throw new Error(result.error || 'Fetch teams failed');
        setTeams(result.data);
      } catch (e) {
        console.error(e);
        setTeams([]);
      }
    };
    loadTeams();
  }, [auth.token, auth.user?.role]);

  // Leader: load members for dropdown filter (filtered by team)
  useEffect(() => {
    const loadUsers = async () => {
      if (auth.user?.role !== 'leader') return;
      if (!auth.token) return;
      try {
        const teamId = selectedTeamId !== 'All' ? selectedTeamId : undefined;
        const { res, result } = await fetchLeaderUsers(auth.token, { teamId, limit: 500, offset: 0 });
        if (!res.ok) throw new Error(result.error || 'Fetch users failed');
        const users = result.data || [];
        setLeaderUsers(users);

        if (selectedUserId !== 'All') {
          const exists = users.some((u) => u.id === selectedUserId);
          if (!exists) setSelectedUserId('All');
        }
      } catch (e) {
        console.error(e);
        setLeaderUsers([]);
        if (selectedUserId !== 'All') setSelectedUserId('All');
      }
    };
    loadUsers();
  }, [auth.token, auth.user?.role, selectedTeamId, selectedUserId]);

  // Keep edit fields in sync with the currently opened plan
  useEffect(() => {
    if (!selectedPlan) return;
    setEditPlanStatus(selectedPlan.status);
    setEditPlanEndDate(selectedPlan.request_deadline_date || selectedPlan.end_date);
  }, [selectedPlan]);

  const handleCreateActionPlan = async (payload: IActionPlan) => {
    try {
      if (!selectedGoal?.id) return;
      const { res, result } = await createActionPlan(auth.token, selectedGoal.id, payload);
      if (!res.ok) throw new Error(result.error || 'Create action plan failed');

      setGoals(prev =>
        prev.map(g =>
          g.id === selectedGoal?.id
            ? { ...g, action_plans: [...(g.action_plans || []), result.data] }
            : g
        )
      );

      setSelectedGoal(null);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Create action plan failed');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 gap-2">
      <Sidebar />
      <main className="flex-1 p-8 gap-6 flex flex-col">
        {/* Year filter */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 items-end">
          <Dropdown
            label="Year"
            value={selectedYear}
            options={years}
            onChange={setSelectedYear}
          />
          {auth.user?.role === 'leader' && (
            <>
              <Dropdown
                label="Team"
                value={selectedTeamId}
                options={[
                  { id: 'All', label: 'All teams' },
                  ...teams.map((t) => ({ id: t.id, label: t.name })),
                ]}
                onChange={(v) => setSelectedTeamId(String(v))}
              />
              <Dropdown
                label="Member"
                value={selectedUserId}
                options={[
                  { id: 'All', label: 'All members' },
                  ...leaderUsers.map((u) => ({
                    id: u.id,
                    label: `${u.name || u.email || u.id}`,
                  })),
                ]}
                onChange={(v) => setSelectedUserId(String(v))}
              />
            </>
          )}
          <Dropdown
            label="Goal Status"
            value={goalStatusFilter}
            options={[...GOAL_STATUS_OPTIONS]}
            onChange={setGoalStatusFilter}
          />
          <Dropdown
            label="Goal Review"
            value={goalReviewFilter}
            options={[...REVIEW_STATUS_OPTIONS]}
            onChange={setGoalReviewFilter}
          />
          <Dropdown
            label="Plan Status"
            value={planStatusFilter}
            options={[...PLAN_STATUS_OPTIONS]}
            onChange={setPlanStatusFilter}
          />
          <Dropdown
            label="Plan Review"
            value={planReviewFilter}
            options={[...REVIEW_STATUS_OPTIONS]}
            onChange={setPlanReviewFilter}
          />
          <div className="inline-block">
            <label className="block text-sm font-semibold mb-1">Search</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-72 px-4 py-2 border rounded-lg"
              placeholder="Goal / Activity / Member / Team"
            />
          </div>
        </div>

        {/* Goals */}
        <div className="space-y-6">
          {filteredGoals.map(goal => {
            const health = getGoalHealth(goal);
            const visiblePlans =
              (goal.action_plans || [])
                .filter((p) => (planStatusFilter === 'All' ? true : p.status === planStatusFilter))
                .filter((p) =>
                  planReviewFilter === 'All'
                    ? true
                    : (p.review_status || 'Cancelled') === planReviewFilter
                )
                .filter((p) => {
                  if (!q) return true;
                  return `${p.activity || ''}`.toLowerCase().includes(q);
                });
            return (
              <div
                key={goal.id}
                className={`p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 
                              hover:shadow-2xl transition duration-300
                              ${goal.is_locked ? 'bg-red-50 dark:bg-red-900/20 border-red-300' : 'bg-white dark:bg-gray-800'}`}
              >
                {/* Goal Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{goal.name}</h3>
                    <div className="flex gap-2 items-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${goal.type === 'Hard' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'}`}>
                        {goal.type}
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full">
                        {health === "On Track" && <span className="text-green-600">🟢 On Track</span>}
                        {health === "At Risk" && <span className="text-orange-600">🟠 At Risk</span>}
                        {health === "High Risk" && <span className="text-red-600">🔴 High Risk</span>}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Deadline: {goal.time_bound}</span>
                    </div>
                  </div>

                  {auth.user?.role !== 'leader' && goal.status === 'Not started' && !goal.is_locked && (
                    <Button onClick={() => setSelectedGoal(goal)} variant="primary">
                      + Add Action Plan
                    </Button>
                  )}
                </div>

                {/* Goal Status */}
                <div className="mb-4">
                  {goal.is_locked && (
                    <div className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300 px-3 py-1 rounded-full w-fit mb-2">
                      {goal.review_status === 'Pending'
                        ? 'Review requested (locked)'
                        : goal.review_status === 'Approved'
                          ? 'Approved (locked)'
                          : 'Locked'}
                    </div>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Progress:</strong> {goal.progress}%<br />
                    <strong>Status:</strong> {goal.status}
                  </p>
                </div>

                {/* Action Plans */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Action Plans</h4>
                  <div className="space-y-3">
                    {visiblePlans.map(plan => (
                      <div
                        key={plan.id}
                        className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => setSelectedPlan(plan)}
                      >
                        {(() => {
                          const planHealth = getActionPlanHealth(plan);
                          return (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Health:{' '}
                              {planHealth === 'On Track' && <span className="text-green-600">🟢 On Track</span>}
                              {planHealth === 'At Risk' && <span className="text-orange-600">🟠 At Risk</span>}
                              {planHealth === 'High Risk' && <span className="text-red-600">🔴 High Risk</span>}
                            </p>
                          );
                        })()}
                        <h5 className="font-semibold text-gray-800 dark:text-white">{plan.activity}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Status: {plan.status} • Deadline: {plan.end_date}
                        </p>
                        {plan.request_deadline_date && (
                          <p className="text-xs text-blue-600 mt-1">
                            Requested deadline: <span className="font-semibold">{plan.request_deadline_date}</span>
                            <span className="text-gray-500"> ({plan.deadline_change_count || 0}/3)</span>
                          </p>
                        )}
                        {(plan.review_status || plan.leader_review_notes) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Review: <span className="font-semibold">{plan.review_status ?? 'Pending'}</span>
                          </p>
                        )}
                      </div>
                    ))}
                    {visiblePlans.length === 0 && (
                      <p className="text-sm text-gray-400 italic">No action plans yet.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Plan Detail */}
        {selectedPlan && (
          <Modal
            isOpen
            title="Action Plan Detail"
            onClose={() => setSelectedPlan(null)}
          >
            <div className="space-y-4">
              <ActionPlanDetail
                plan={selectedPlan}
                refreshKey={weeklyReportRefreshKey}
                createdWeeklyReport={lastCreatedWeeklyReport}
              />

              {auth.user?.role !== 'leader' && (
                <div className="border rounded p-3 bg-white space-y-3">
                  <h4 className="font-semibold">Edit</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Dropdown
                      label="Status"
                      value={editPlanStatus}
                      options={['Not started', 'In Progress', 'Completed', 'Blocked']}
                      onChange={(v) => setEditPlanStatus(v as IActionPlan['status'])}
                    />

                    <div>
                      <label className="block text-sm font-semibold mb-1">End date</label>
                      <div className="text-xs text-gray-500 mb-1">
                        Current: <span className="font-semibold">{selectedPlan.end_date}</span>
                        {selectedPlan.request_deadline_date && (
                          <>
                            {' '}• Requested: <span className="font-semibold">{selectedPlan.request_deadline_date}</span>
                          </>
                        )}
                      </div>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border rounded-lg"
                        value={editPlanEndDate}
                        onChange={(e) => setEditPlanEndDate(e.target.value)}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Deadline changes used: {selectedPlan.deadline_change_count || 0}/3
                      </div>
                    </div>
                  </div>

                  {selectedPlan.review_status === 'Pending' && selectedPlan.is_locked && (
                    <p className="text-sm text-gray-500 italic">
                      Pending review: Allow edit deadline only. Status will locked until leader review.
                    </p>
                  )}

                  <Button
                    variant="success"
                    disabled={
                      selectedPlan.review_status === 'Pending' &&
                      selectedPlan.is_locked &&
                      editPlanEndDate === (selectedPlan.request_deadline_date || selectedPlan.end_date)
                    }
                    onClick={async () => {
                      const payload: Partial<IActionPlan> = {};

                      // Deadline change always allowed; backend will auto set Pending+lock.
                      const currentDeadline = selectedPlan.request_deadline_date || selectedPlan.end_date;
                      if (editPlanEndDate && editPlanEndDate !== currentDeadline) {
                        payload.end_date = editPlanEndDate;
                      }

                      // Only allow status update when not pending locked
                      const canEditStatus = !(selectedPlan.review_status === 'Pending' && selectedPlan.is_locked);
                      if (canEditStatus && editPlanStatus !== selectedPlan.status) {
                        payload.status = editPlanStatus;
                      }

                      if (Object.keys(payload).length === 0) return;

                      const { res, result } = await updateActionPlan(auth.token, selectedPlan.id, payload);
                      if (!res.ok) return alert(result.error || 'Update action plan failed');

                      setGoals((prev) =>
                        prev.map((g) => ({
                          ...g,
                          action_plans: g.action_plans?.map((p) => (p.id === selectedPlan.id ? result.data : p)),
                        }))
                      );
                      setSelectedPlan(result.data);
                      setEditPlanStatus(result.data.status);
                      setEditPlanEndDate(result.data.request_deadline_date || result.data.end_date);
                    }}
                  >
                    Save changes
                  </Button>
                </div>
              )}

              {auth.user?.role === 'leader' && selectedPlan.request_deadline_date && (
                <div className="border rounded p-3 bg-gray-50">
                  <p>
                    <strong>Member requested deadline change:</strong> {selectedPlan.end_date} →{' '}
                    <span className="font-semibold">{selectedPlan.request_deadline_date}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Changes used: {selectedPlan.deadline_change_count || 0}/3
                  </p>
                </div>
              )}

              {auth.user?.role !== 'leader' && (
                <div className="space-y-2">
                  {(selectedPlan.status === 'In Progress' || selectedPlan.status === 'Blocked') ? (
                    <Button onClick={() => setCreateWeeklyForPlan(selectedPlan)} variant="primary">
                      + Add Weekly Report
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Weekly report allow crete Action Plan is In Progress/Blocked.
                    </p>
                  )}
                </div>
              )}

              {(selectedPlan.review_status || selectedPlan.leader_review_notes) && (
                <div className="border rounded p-3 bg-gray-50">
                  <p><strong className='font-medium'>Review status:</strong> {selectedPlan.review_status ?? 'Pending'}</p>
                  <p><strong className='font-medium'>Leader notes:</strong> {selectedPlan.leader_review_notes || '-'}</p>
                </div>
              )}

              {auth.user?.role !== 'leader' && (
                <div className="space-y-2">
                  {selectedPlan.review_status === 'Pending' && selectedPlan.is_locked && (
                    <Button
                      onClick={async () => {
                        const { res, result } = await cancelActionPlanReview(auth.token, selectedPlan.id);
                        if (!res.ok) return alert(result.error || 'Cancel request failed');

                        setGoals((prev) =>
                          prev.map((g) => ({
                            ...g,
                            action_plans: g.action_plans?.map((p) => (p.id === selectedPlan.id ? result.data : p)),
                          }))
                        );
                        setSelectedPlan(result.data);
                      }}
                      variant="secondary"
                    >
                      Cancel review request (unlock)
                    </Button>
                  )}

                  {selectedPlan.review_status !== 'Approved' && !selectedPlan.is_locked && (
                    <Button
                      onClick={async () => {
                        const { res, result } = await requestActionPlanReview(auth.token, selectedPlan.id);
                        if (!res.ok) return alert(result.error || 'Request review failed');

                        setGoals((prev) =>
                          prev.map((g) => ({
                            ...g,
                            action_plans: g.action_plans?.map((p) => (p.id === selectedPlan.id ? result.data : p)),
                          }))
                        );
                        setSelectedPlan(result.data);
                      }}
                      variant="primary"
                    >
                      Request leader review (lock)
                    </Button>
                  )}
                </div>
              )}

              {auth.user?.role === 'leader' && (
                <Button onClick={() => setReviewPlan(selectedPlan)} variant="primary">
                  Review Action Plan
                </Button>
              )}
            </div>
          </Modal>
        )}

        {createWeeklyForPlan && (
          <WeeklyReportCreateModal
            plan={createWeeklyForPlan}
            onClose={() => setCreateWeeklyForPlan(null)}
            onSubmit={async (payload) => {
              const { res, result } = await createWeeklyReport(auth.token, createWeeklyForPlan.id, payload);
              if (!res.ok) throw new Error(result.error || 'Create weekly report failed');

              // Direction B: weekly reports are loaded lazily (per plan) so we don't keep them inside goal list state.
              // We just close the modal; the detail view refetches its first page via refreshKey.

              setLastCreatedWeeklyReport(result.data ?? null);
              setWeeklyReportRefreshKey((k) => k + 1);
              setCreateWeeklyForPlan(null);
            }}
          />
        )}

        {reviewPlan && (
          <ReviewActionPlanModal
            plan={reviewPlan}
            onClose={() => setReviewPlan(null)}
            onSubmit={async (payload) => {
              await reviewLeaderActionPlan(auth.token, reviewPlan.id, payload);
              setGoals((prev) =>
                prev.map((g) => ({
                  ...g,
                  action_plans: g.action_plans?.map((p) =>
                    p.id === reviewPlan.id
                      ? { ...p, review_status: payload.status, leader_review_notes: payload.comment }
                      : p
                  ),
                }))
              );
              setSelectedPlan((p) =>
                p && p.id === reviewPlan.id
                  ? { ...p, review_status: payload.status, leader_review_notes: payload.comment }
                  : p
              );
              setReviewPlan(null);
            }}
          />
        )}

        {/* Create Action Plan */}
        {selectedGoal && (
          <Modal
            isOpen
            title={`Add Action Plan for "${selectedGoal.name}"`}
            onClose={() => setSelectedGoal(null)}
          >
            <CreateActionPlanForm
              goalId={selectedGoal.id}
              onSubmit={handleCreateActionPlan}
              onCancel={() => {
                setSelectedGoal(null);
                fetchGoals();
              }}
            />
          </Modal>
        )}
      </main>
    </div>
  );
}