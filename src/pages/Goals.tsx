import { useMemo, useState, useEffect } from 'react';
import GoalCard from '../components/GoalCard';
import Modal from '../common/Modal';
import type { IGoal } from '../types';
import Dropdown from '../components/Dropdown';
import { useAuth } from '../common/AuthContext';
import Sidebar from '../components/Sidebar';
import { YEAR_OPTIONS } from '../common/constants';
import { GoalCreateFormFields } from '../components/goals/GoalCreateFormFields';
import { useGoalDraft } from '../components/goals/useGoalDraft';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { DateInput } from '../components/DateInput';
import { NumberInput } from '../components/NumberInput';
import {
  createGoal,
  deleteGoal as apiDeleteGoal,
  fetchGoals as apiFetchGoals,
  requestGoalReview,
  cancelGoalReview,
  updateGoal as apiUpdateGoal,
} from '../api/goalsApi';
import { fetchLeaderGoals } from '../api/leaderApi';
import { fetchLeaderUsers, type LeaderUser } from '../api/usersApi';
import { fetchLeaderTeams, type LeaderTeam } from '../api/teamsApi';
import { formatDateOnly } from '../common/Utility';

export default function GoalsPage() {
  const years = YEAR_OPTIONS;
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [goalStatusFilter, setGoalStatusFilter] = useState<string>('All');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('All');
  const [teams, setTeams] = useState<LeaderTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('All');
  const [leaderUsers, setLeaderUsers] = useState<LeaderUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('All');
  const [detailGoal, setDetailGoal] = useState<IGoal | null>(null);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [deleteGoal, setDeleteGoal] = useState<IGoal | null>(null);
  const [editGoal, setEditGoal] = useState<IGoal | null>(null);
  const [goals , setGoals] = useState<IGoal[]>([]);
  const { auth } = useAuth();
  const { draft, setField, onDurationTypeChange, onStartDateChange, reset } = useGoalDraft();
  const isMember = auth.user?.role === 'member';
  const isLeader = auth.user?.role === 'leader';
  const [leaderIsLoading, setLeaderIsLoading] = useState(false);
  const [leaderHasMore, setLeaderHasMore] = useState(true);
  const leaderPageLimit = 10;
  const isStatusProgressOnlyEdit = useMemo(() => {
    if (!editGoal) return false;
    if (!isMember) return false;
    // Once a goal is started, member can update status + progress only (not other fields).
    // Also: after leader approval (locked), still allow status/progress only.
    return editGoal.status !== 'Not started' || editGoal.is_locked;
  }, [editGoal, isMember]);
  const isFullyLockedForReview = useMemo(() => {
    if (!editGoal) return false;
    if (!isMember) return false;
    // While Pending review, backend blocks all member edits.
    return !!editGoal.is_locked && (editGoal.review_status || 'Pending') === 'Pending';
  }, [editGoal, isMember]);

  const GOAL_STATUS_OPTIONS = ['All', 'Draft', 'In Progress', 'Completed', 'Cancelled', 'Not started'] as const;
  const REVIEW_STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'] as const;

  function validateCreateGoal() {
    const next: Record<string, string> = {};

    if (!draft.name.trim()) next.name = 'Goal title is required';
    if (!draft.start_date) next.start_date = 'Start date is required';
    if (!draft.time_bound) next.time_bound = 'Deadline could not be calculated. Please select a start date.';
    if (draft.start_date && draft.time_bound && draft.time_bound < draft.start_date) {
      next.time_bound = 'Deadline must be on or after start date';
    }

    if (Number.isNaN(draft.progress) || draft.progress < 0 || draft.progress > 100) {
      next.progress = 'Progress must be between 0 and 100';
    }
    if (Number.isNaN(draft.weight) || draft.weight < 0 || draft.weight > 100) {
      next.weight = 'Weight must be between 0 and 100';
    }

    setCreateErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!validateCreateGoal()) return;
    try {
      const token = auth.token;
      const userId = auth.user?.id;

      const newGoal = {
        user_id: userId,
        year: new Date().getFullYear(),
        name: draft.name,
        type: draft.type,
        duration_type: draft.durationType,
        skill: draft.skill,
        specific: draft.specific,
        measurable: draft.measurable,
        achievable: draft.achievable,
        relevant: draft.relevant,
        start_date: draft.start_date,
        time_bound: draft.time_bound,
        success_metric: draft.success_metric,
        status: draft.status,
        weight: draft.weight,
        progress: draft.progress,
        risk: draft.risk,
        dependencies: draft.dependencies,
        notes: draft.notes,
        is_locked : false
      };

      const { result } = await createGoal(token, newGoal);
      
      setGoals((prev) => [...prev, result.data]);
      reset();
      setCreateErrors({});
      setIsAddGoalOpen(false);
    } catch (err) {
      console.error('Error creating goal:', err);
    }
  }

  async function handleDeleteGoal(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!deleteGoal?.id) return;
      const { res } = await apiDeleteGoal(auth.token, deleteGoal.id);
      if (res.ok) {
        setGoals(prev => prev.filter(g => g.id !== deleteGoal?.id));
      }
      setDeleteGoal(null);
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  }

  async function handleUpdateGoal(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!editGoal?.id) return;
      const payload = isStatusProgressOnlyEdit
        ? { progress: editGoal.progress, status: editGoal.status }
        : editGoal;
      const { res, result } = await apiUpdateGoal(auth.token, editGoal.id, payload);
      if (!res.ok) return alert(result.error || 'Update goal failed');
      if (!result.data) return alert('Update goal failed');
      setGoals((prev) => prev.map((g) => (g.id === result.data!.id ? result.data! : g)));
      setEditGoal(null);
    } catch (err) {
      console.error('Error updating goal:', err);
    }
  }

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const token = auth.token;
        if (auth.user?.role === 'leader') {
          setLeaderIsLoading(true);
          const userId = selectedUserId !== 'All' ? selectedUserId : undefined;
          const teamId = selectedTeamId !== 'All' ? selectedTeamId : undefined;
          const { result } = await fetchLeaderGoals(token, {
            year: selectedYear,
            userId,
            teamId,
            limit: leaderPageLimit,
            offset: 0,
          });
          setGoals(result.data);
          setLeaderHasMore((result.data || []).length === leaderPageLimit);
          setLeaderIsLoading(false);
        } else {
          const { result } = await apiFetchGoals(token);
          setGoals(result.data);
        }
        setDetailGoal(null);
      } catch (err) {
        console.error('Error fetching goals:', err);
      }
    };

    loadGoals();
  }, [auth.token, auth.user?.role, selectedYear, selectedUserId, selectedTeamId]);

  // Leader: load users for dropdown filter (from users table)
  useEffect(() => {
    const loadUsers = async () => {
      if (!isLeader) return;
      if (!auth.token) return;
      try {
        const teamId = selectedTeamId !== 'All' ? selectedTeamId : undefined;
        const { res, result } = await fetchLeaderUsers(auth.token, { teamId, limit: 500, offset: 0 });
        if (!res.ok) throw new Error(result.error || 'Fetch users failed');
        const users = result.data || [];
        setLeaderUsers(users);

        // If current selected member isn't in this team, reset to All.
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
  }, [auth.token, isLeader, selectedTeamId, selectedUserId]);

  // Leader: load teams for dropdown filter
  useEffect(() => {
    const loadTeams = async () => {
      if (!isLeader) return;
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
  }, [auth.token, isLeader]);

  const loadMoreLeaderGoals = async () => {
    if (!isLeader) return;
    if (!auth.token) return;
    if (leaderIsLoading) return;
    if (!leaderHasMore) return;

    setLeaderIsLoading(true);
    try {
      const offset = goals.length;
      const userId = selectedUserId !== 'All' ? selectedUserId : undefined;
      const teamId = selectedTeamId !== 'All' ? selectedTeamId : undefined;
      const { result } = await fetchLeaderGoals(auth.token, {
        year: selectedYear,
        userId,
        teamId,
        limit: leaderPageLimit,
        offset,
      });
      const next = result.data || [];
      setGoals((prev) => {
        const seen = new Set(prev.map((g) => g.id));
        const merged = [...prev];
        for (const g of next) if (!seen.has(g.id)) merged.push(g);
        return merged;
      });
      setLeaderHasMore(next.length === leaderPageLimit);
    } finally {
      setLeaderIsLoading(false);
    }
  };

  const filteredGoals = goals
    .filter((g) => g.year === Number(selectedYear))
    .filter((g) => {
      if (!isLeader) return true;
      if (!selectedUserId || selectedUserId === 'All') return true;
      return g.user_id === selectedUserId;
    })
    .filter((g) => (goalStatusFilter === 'All' ? true : g.status === goalStatusFilter))
    .filter((g) =>
      reviewStatusFilter === 'All'
        ? true
        : (g.review_status || 'Cancelled') === reviewStatusFilter
    );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Goals</h1>
        <div className="flex space-x-6 mb-6 flex-wrap gap-y-2">
          <Dropdown
              label="Year"
              value={selectedYear}
              options={years}
              onChange={setSelectedYear}
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
          {isLeader && (
            <>
              <Dropdown
                label="Team"
                value={selectedTeamId}
                options={[
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
        </div>

        {isMember && (
          <Button onClick={() => setIsAddGoalOpen(true)} variant="primary" className="mb-6">
            + Add Goal
          </Button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDetailClick={() => setDetailGoal(goal)}
              onDeleteClick={setDeleteGoal}
              onUpdateClick={setEditGoal}
              showActions={auth.user?.role !== 'leader'}
            />
          ))}
        </div>

        {isLeader && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-xs text-gray-500">
              Loaded: {goals.length} goals{leaderIsLoading ? ' (loading...)' : ''}
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={!leaderHasMore || leaderIsLoading}
              onClick={loadMoreLeaderGoals}
            >
              {leaderHasMore ? 'Load more' : 'No more'}
            </Button>
          </div>
        )}

        {editGoal && (
          <Modal
            isOpen={!!editGoal}
            title={isStatusProgressOnlyEdit ? 'Update Status & Progress' : 'Edit Goal'}
            onClose={() => setEditGoal(null)}
          >
            <form className="space-y-4" onSubmit={handleUpdateGoal}>
              <Input
                label="Goal Title"
                value={editGoal.name}
                disabled={isStatusProgressOnlyEdit || isFullyLockedForReview}
                onChange={(val) => setEditGoal({ ...editGoal, name: val })}
              />
              <Input
                label="Skill"
                value={editGoal.skill}
                disabled={isStatusProgressOnlyEdit || isFullyLockedForReview}
                onChange={(val) => setEditGoal({ ...editGoal, skill: val })}
              />
              <DateInput
                label="Start Date"
                value={editGoal.start_date}
                disabled={isStatusProgressOnlyEdit || isFullyLockedForReview}
                onChange={(val) => setEditGoal({ ...editGoal, start_date: val })}
              />
              <DateInput
                label="Deadline"
                value={editGoal.time_bound}
                disabled={isStatusProgressOnlyEdit || isFullyLockedForReview}
                onChange={(val) => setEditGoal({ ...editGoal, time_bound: val })}
              />
              <Dropdown
                label="Status"
                value={editGoal.status}
                disabled={isFullyLockedForReview}
                options={['Draft','In Progress','Completed','Cancelled','Not started']}
                onChange={(val) => setEditGoal({ ...editGoal, status: val })}
              />
              <NumberInput
                label="Progress (%)"
                value={editGoal.progress}
                min={0}
                max={100}
                disabled={isFullyLockedForReview}
                onChange={(val) => {
                  const progress = Math.max(0, Math.min(100, Number(val)));
                  setEditGoal({
                    ...editGoal,
                    progress,
                    status: progress >= 100 ? 'Completed' : editGoal.status,
                  });
                }}
              />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setEditGoal(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save
                </Button>
              </div>
            </form>
          </Modal>
        )}


        {deleteGoal && (
          <Modal
            isOpen={!!deleteGoal}
            title="Confirm"
            onClose={() => setDeleteGoal(null)}
          >
            <p className="mb-4">
              Are you sure to delete the Goal:
              <strong className="block mt-1">{deleteGoal.name}</strong>
            </p>
            <form className="space-y-4" onSubmit={handleDeleteGoal}>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setDeleteGoal(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger">
                  Confirm
                </Button>
              </div>
            </form>
          </Modal>
        )}

        <Modal
          isOpen={isAddGoalOpen || !!detailGoal}
          title={detailGoal?.id ? 'Detail Goal' : 'Add Goal'}
          onClose={() => {
            setDetailGoal(null);
            setIsAddGoalOpen(false);
            setCreateErrors({});
          }}
        >
          {detailGoal?.id ? (
            <div className="space-y-2">
              <p>
                <strong>Goal Title:</strong> {detailGoal.name}
              </p>
              <p>
                <strong>Skill:</strong> {detailGoal.skill}
              </p>
              <p>
                <strong>Progress:</strong> {detailGoal.progress}%
              </p>
              <p>
                <strong>Status:</strong> {detailGoal.status}
              </p>
              <p>
                <strong>Review:</strong> {detailGoal.review_status ?? 'Not requested'}
              </p>
              {detailGoal.leader_review_notes && (
                <p>
                  <strong>Leader notes:</strong> {detailGoal.leader_review_notes}
                </p>
              )}

              {(detailGoal.reviewed_at ||
                detailGoal.approved_at ||
                detailGoal.rejected_at ||
                detailGoal.reviewed_by_name ||
                detailGoal.reviewed_by_email ||
                detailGoal.reviewed_by) && (
                <div className="border rounded p-3 bg-gray-50 mt-3 text-sm space-y-1">
                  <p>
                    <strong>Reviewed by:</strong>{' '}
                    {detailGoal.reviewed_by_name ||
                      detailGoal.reviewed_by_email ||
                      detailGoal.reviewed_by ||
                      '-'}
                  </p>
                  <p>
                    <strong>Reviewed at:</strong> {formatDateOnly(detailGoal.reviewed_at) || '-'}
                  </p>
                  <p>
                    <strong>Approved at:</strong> {formatDateOnly(detailGoal.approved_at) || '-'}
                  </p>
                  <p>
                    <strong>Rejected at:</strong> {formatDateOnly(detailGoal.rejected_at) || '-'}
                  </p>
                </div>
              )}

              {detailGoal.review_status === 'Pending' && detailGoal.is_locked && (
                <div className="pt-3">
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const { res, result } = await cancelGoalReview(auth.token, detailGoal.id);
                      if (!res.ok) return alert(result.error || 'Cancel request failed');
                      setGoals((prev) => prev.map((g) => (g.id === detailGoal.id ? result.data : g)));
                      setDetailGoal(result.data);
                    }}
                  >
                    Cancel review request (unlock)
                  </Button>
                </div>
              )}

              {detailGoal.review_status !== 'Approved' && !detailGoal.is_locked && (
                <div className="pt-3">
                  <Button
                    variant="primary"
                    onClick={async () => {
                      const { res, result } = await requestGoalReview(auth.token, detailGoal.id);
                      if (!res.ok) return alert(result.error || 'Request review failed');
                      setGoals((prev) => prev.map((g) => (g.id === detailGoal.id ? result.data : g)));
                      setDetailGoal(result.data);
                    }}
                  >
                    Request leader review (lock)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleCreateGoal}>
              <GoalCreateFormFields
                draft={draft}
                onFieldChange={setField}
                onStartDateChange={onStartDateChange}
                onDurationTypeChange={onDurationTypeChange}
                errors={createErrors}
              />
              <div className="flex justify-end mt-6 space-x-4">
                <Button type="submit" variant="primary">
                  Add Goal
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </main>
      
    </div>
  );
}