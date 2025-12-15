import { FaBullseye, FaCheckCircle, FaClipboardList, FaPlus } from 'react-icons/fa';
import StatsCard from './StatsCard';
import GoalCard from './GoalCard';
import type { IGoal } from '../types';
import { useState, useEffect } from 'react';
import Dropdown from './Dropdown';
import Sidebar from './Sidebar';
import Modal from '../common/Modal';
import { useAuth } from '../common/AuthContext';
import { YEAR_OPTIONS } from '../common/constants';
import { GoalCreateFormFields } from './goals/GoalCreateFormFields';
import { useGoalDraft } from './goals/useGoalDraft';
import {
  createGoal,
  deleteGoal as apiDeleteGoal,
  fetchGoals as apiFetchGoals,
  updateGoal as apiUpdateGoal,
} from '../api/goalsApi';

export default function MemberDashboard({ onDetailClick }: { onDetailClick: (goal: IGoal) => void }) {
  const { auth } = useAuth();
  const years = YEAR_OPTIONS;
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<IGoal | null>(null);
  const [goals, setGoals] = useState<IGoal[]>([]);
  const [deleteGoal, setDeleteGoal] = useState<IGoal | null>(null);
  const [editGoal, setEditGoal] = useState<IGoal | null>(null);

  const filteredGoals = goals.filter(g => g.year === Number(selectedYear));
  const inProgressGoals = filteredGoals.filter(g => g.status === 'In Progress').length;
  const completedGoals = filteredGoals.filter(g => g.status === 'Completed').length;
  const failedGoals = filteredGoals.filter(g => new Date(g.time_bound) < new Date()).length;
  const totalGoals = filteredGoals.length;
  const avgProgress = totalGoals > 0 ? filteredGoals.reduce((sum, g) => sum + g.progress, 0) / totalGoals : 0;

  const { draft, setField, onDurationTypeChange, onStartDateChange, reset } = useGoalDraft();

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const token = auth.token;
        const { result } = await apiFetchGoals(token);
        setGoals(result.data);
      } catch (err) {
        console.error('Error fetching goals:', err);
      }
    };

    loadGoals();
  }, []);

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    try {
      const token = auth.token;
      const userId = auth.user?.id;

      const newGoal = {
        user_id: userId,
        user_email: auth.user?.email,
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
      const { result } = await apiUpdateGoal(auth.token, editGoal.id, editGoal);
      setGoals(prev => prev.map(g => g.id === result.data.id ? result.data : g));
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
          Halo, {auth.user?.email || 'bạn'} 👋
          {auth.user?.role}
        </p>

        {/* Dropdown chọn năm */}
        <div className="flex space-x-6 mb-6">
          <Dropdown
            label="Year"
            value={selectedYear}
            options={years}
            onChange={setSelectedYear}
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
            <button
              className="flex items-center px-6 py-3 bg-brand text-white font-semibold rounded-lg shadow-md hover:bg-brand-dark transition duration-300"
              onClick={() => setShowCreateModal(true)} // mở modal tạo goal
            >
              <FaPlus className="mr-2" /> Add Goal
            </button>
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
              />
            ))}
          </div>
        </div>

        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            title="New Goal"
            onClose={() => setShowCreateModal(false)}
          >
            <form className="space-y-4" onSubmit={handleCreateGoal}>
              <GoalCreateFormFields
                draft={draft}
                onFieldChange={setField}
                onStartDateChange={onStartDateChange}
                onDurationTypeChange={onDurationTypeChange}
              />
              <div className="flex justify-end mt-6 space-x-4">
                <button
                  type="submit"
                  className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  Add Goal
                </button>
              </div>
            </form>
          </Modal>
        )}

        {editGoal && (
          <Modal
            isOpen={!!editGoal}
            title="Edit Goal"
            onClose={() => setEditGoal(null)}
          >
            <form className="space-y-4" onSubmit={handleUpdateGoal}>
              <Input label="Goal Title" value={editGoal.name}
                onChange={(val) => setEditGoal({ ...editGoal, name: val })} />
              <Input label="Skill" value={editGoal.skill}
                onChange={(val) => setEditGoal({ ...editGoal, skill: val })} />
              <DateInput label="Start Date" value={editGoal.start_date}
                onChange={(val) => setEditGoal({ ...editGoal, start_date: val })} />
              <DateInput label="Deadline" value={editGoal.time_bound}
                onChange={(val) => setEditGoal({ ...editGoal, time_bound: val })} />
              <Dropdown label="Status" value={editGoal.status}
                options={['Draft', 'In Progress', 'Completed', 'Cancelled', 'Not started']}
                onChange={(val) => setEditGoal({ ...editGoal, status: val })} />
              <NumberInput label="Progress (%)" value={editGoal.progress}
                onChange={(val) => setEditGoal({ ...editGoal, progress: val })} />

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditGoal(null)}
                  className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
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
                <button
                  type="button"
                  onClick={() => setDeleteGoal(null)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Confirm
                </button>
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
              </>
            )}
          </Modal>
        )}
      </main>
    </div>
  );
}