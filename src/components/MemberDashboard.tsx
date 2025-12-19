import { FaBullseye, FaCheckCircle, FaClipboardList, FaPlus } from 'react-icons/fa';
import StatsCard from './StatsCard';
import GoalCard from './GoalCard';
import type { IGoal } from '../types';
import { useMemo, useState, useEffect } from 'react';
import Dropdown from './Dropdown';
import Sidebar from './Sidebar';
import Modal from '../common/Modal';
import { useAuth } from '../common/AuthContext';
import { YEAR_OPTIONS } from '../common/constants';
import { GoalCreateFormFields } from './goals/GoalCreateFormFields';
import { useGoalDraft } from './goals/useGoalDraft';
import { Button } from './Button';
import {
  createGoal,
  deleteGoal as apiDeleteGoal,
  fetchGoals as apiFetchGoals,
  requestGoalReview,
  cancelGoalReview,
  updateGoal as apiUpdateGoal,
} from '../api/goalsApi';
import { Input } from './Input';
import { DateInput } from './DateInput';
import { NumberInput } from './NumberInput';
import { formatDateOnly } from '../common/Utility';

export default function MemberDashboard() {
  const { auth } = useAuth();
  const isMember = auth.user?.role === 'member';
  const years = YEAR_OPTIONS;
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [goalStatusFilter, setGoalStatusFilter] = useState<string>('All');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [selectedGoal, setSelectedGoal] = useState<IGoal | null>(null);
  const [goals, setGoals] = useState<IGoal[]>([]);
  const [deleteGoal, setDeleteGoal] = useState<IGoal | null>(null);
  const [editGoal, setEditGoal] = useState<IGoal | null>(null);
  const isProgressOnlyEdit = useMemo(() => {
    if (!editGoal) return false;
    if (!isMember) return false;
    return editGoal.status !== 'Not started' || editGoal.is_locked;
  }, [editGoal, isMember]);

  const GOAL_STATUS_OPTIONS = ['All', 'Draft', 'In Progress', 'Completed', 'Cancelled', 'Not started'] as const;
  const REVIEW_STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'] as const;

  const filteredGoals = goals
    .filter((g) => g.year === Number(selectedYear))
    .filter((g) => (goalStatusFilter === 'All' ? true : g.status === goalStatusFilter))
    .filter((g) =>
      reviewStatusFilter === 'All'
        ? true
        : (g.review_status || 'Cancelled') === reviewStatusFilter
    );
  const inProgressGoals = filteredGoals.filter(g => g.status === 'In Progress').length;
  const completedGoals = filteredGoals.filter(g => g.status === 'Completed').length;
  const failedGoals = filteredGoals.filter(g => new Date(g.time_bound) < new Date()).length;
  const totalGoals = filteredGoals.length;
  const avgProgress = totalGoals > 0 ? filteredGoals.reduce((sum, g) => sum + g.progress, 0) / totalGoals : 0;

  const { draft, setField, onDurationTypeChange, onStartDateChange, reset } = useGoalDraft();

  useEffect(() => {
    const loadGoals = async () => {
      try {
        if (!auth.token) return;
        const token = auth.token;
        const { result } = await apiFetchGoals(token);
        setGoals(result.data);
      } catch (err) {
        console.error('Error fetching goals:', err);
      }
    };

    loadGoals();
  }, [auth.token]);

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
        user_email: auth.user?.email,
        user_name: auth.user?.name,
        team: auth.user?.team || '',
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
        is_locked: false
      };

      const { result } = await createGoal(token, newGoal);

      setShowCreateModal(false);
      setGoals((prev) => [...prev, result.data]);
      reset();
      setCreateErrors({});
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
      const payload = isProgressOnlyEdit ? { progress: editGoal.progress } : editGoal;
      const { res, result } = await apiUpdateGoal(auth.token, editGoal.id, payload);
      if (!res.ok) return alert(result.error || 'Update goal failed');
      setGoals((prev) => prev.map((g) => (g.id === result.data.id ? result.data : g)));
      setEditGoal(null);
    } catch (err) {
      console.error('Error updating goal:', err);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar bên trái */}
      <Sidebar />

      {/* Nội dung chính */}
      <main className="flex-1 p-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
          Dashboard IDP/OKR
        </h1>
        <p className="text-xl text-gray-500 mb-10">
          Halo, {auth.user?.name || auth.user?.email || 'bạn'} 👋
          {auth.user?.role}
        </p>

        {/* Dropdown chọn năm */}
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
        </div>

        <div className="space-y-12">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatsCard
              title="Goals In-progress"
              stat={inProgressGoals}
              icon={FaBullseye}
            />
            <StatsCard
              title="Goals Completed"
              stat={completedGoals}
              icon={FaCheckCircle}
            />
            <StatsCard
              title="Goal Failed"
              stat={failedGoals}
              icon={FaClipboardList}
            />
            <StatsCard
              title="Avg progress"
              stat={`${avgProgress.toFixed(1)}%`}
              icon={FaClipboardList}
            />
          </div>

          {/* Goals header + nút tạo mới */}
          <div className="flex justify-between items-center pt-4 pb-2">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Goal In-progress ({filteredGoals.length})
            </h2>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              className="flex items-center px-6 py-3 shadow-md"
            >
              <FaPlus className="mr-2" /> Add Goal
            </Button>
          </div>

          {/* Danh sách goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onDetailClick={setSelectedGoal}
                onDeleteClick={setDeleteGoal}
                onUpdateClick={setEditGoal}
                showActions={auth.user?.role !== 'leader'}
              />
            ))}
          </div>
        </div>

        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            title="New Goal"
            onClose={() => {
              setShowCreateModal(false);
              setCreateErrors({});
            }}
          >
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
          </Modal>
        )}

        {editGoal && (
          <Modal
            isOpen={!!editGoal}
            title={isProgressOnlyEdit ? 'Update Progress' : 'Edit Goal'}
            onClose={() => setEditGoal(null)}
          >
            <form className="space-y-4" onSubmit={handleUpdateGoal}>
              <Input
                label="Goal Title"
                value={editGoal.name}
                disabled={isProgressOnlyEdit}
                onChange={(val) => setEditGoal({ ...editGoal, name: val })}
              />
              <Input
                label="Skill"
                value={editGoal.skill}
                disabled={isProgressOnlyEdit}
                onChange={(val) => setEditGoal({ ...editGoal, skill: val })}
              />
              <DateInput
                label="Start Date"
                value={editGoal.start_date}
                disabled={isProgressOnlyEdit}
                onChange={(val) => setEditGoal({ ...editGoal, start_date: val })}
              />
              <DateInput
                label="Deadline"
                value={editGoal.time_bound}
                disabled={isProgressOnlyEdit}
                onChange={(val) => setEditGoal({ ...editGoal, time_bound: val })}
              />
              <Dropdown
                label="Status"
                value={editGoal.status}
                disabled={isProgressOnlyEdit}
                options={['Draft', 'In Progress', 'Completed', 'Cancelled', 'Not started']}
                onChange={(val) => setEditGoal({ ...editGoal, status: val })}
              />
              <NumberInput
                label="Progress (%)"
                value={editGoal.progress}
                min={0}
                max={100}
                onChange={(val) => setEditGoal({ ...editGoal, progress: val })}
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

        {selectedGoal && (
          <Modal
            isOpen={!!selectedGoal}
            title="Detail Goal"
            onClose={() => setSelectedGoal(null)}
          >
            {selectedGoal && (
              <>
                <p><strong>Goal title:</strong> {selectedGoal.name}</p>
                <p><strong>Deadline:</strong> {selectedGoal.time_bound || 'Chưa có'}</p>
                <p><strong>Progress:</strong> {selectedGoal.progress}%</p>
                <p><strong>Goal Type:</strong> {selectedGoal.type}</p>
                <p><strong>Skill related:</strong> {selectedGoal.skill}</p>
                <p><strong>Goal Status:</strong> {selectedGoal.status}</p>
                <p><strong>Review:</strong> {selectedGoal.review_status ?? 'Not requested'}</p>
                {selectedGoal.leader_review_notes && (
                  <p><strong>Leader notes:</strong> {selectedGoal.leader_review_notes}</p>
                )}

                {(selectedGoal.reviewed_at ||
                  selectedGoal.approved_at ||
                  selectedGoal.rejected_at ||
                  selectedGoal.reviewed_by_name ||
                  selectedGoal.reviewed_by_email ||
                  selectedGoal.reviewed_by) && (
                  <div className="border rounded p-3 bg-gray-50 mt-3 text-sm space-y-1">
                    <p>
                      <strong>Reviewed by:</strong>{' '}
                      {selectedGoal.reviewed_by_name ||
                        selectedGoal.reviewed_by_email ||
                        selectedGoal.reviewed_by ||
                        '-'}
                    </p>
                    <p>
                      <strong>Reviewed at:</strong> {formatDateOnly(selectedGoal.reviewed_at) || '-'}
                    </p>
                    <p>
                      <strong>Approved at:</strong> {formatDateOnly(selectedGoal.approved_at) || '-'}
                    </p>
                    <p>
                      <strong>Rejected at:</strong> {formatDateOnly(selectedGoal.rejected_at) || '-'}
                    </p>
                  </div>
                )}

                {selectedGoal.review_status === 'Pending' && selectedGoal.is_locked && (
                  <div className="pt-3">
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        const { res, result } = await cancelGoalReview(auth.token, selectedGoal.id);
                        if (!res.ok) return alert(result.error || 'Cancel request failed');
                        setGoals((prev) => prev.map((g) => (g.id === selectedGoal.id ? result.data : g)));
                        setSelectedGoal(result.data);
                      }}
                    >
                      Cancel review request (unlock)
                    </Button>
                  </div>
                )}

                {selectedGoal.review_status !== 'Approved' && !selectedGoal.is_locked && (
                  <div className="pt-3">
                    <Button
                      variant="primary"
                      onClick={async () => {
                        const { res, result } = await requestGoalReview(auth.token, selectedGoal.id);
                        if (!res.ok) return alert(result.error || 'Request review failed');
                        setGoals((prev) => prev.map((g) => (g.id === selectedGoal.id ? result.data : g)));
                        setSelectedGoal(result.data);
                      }}
                    >
                      Request leader review (lock)
                    </Button>
                  </div>
                )}
              </>
            )}
          </Modal>
        )}
      </main>
    </div>
  );
}