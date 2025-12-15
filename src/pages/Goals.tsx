import { useState, useEffect } from 'react';
import GoalCard from '../components/GoalCard';
import Modal from '../common/Modal';
import type { IGoal } from '../types';
import Dropdown from '../components/Dropdown';
import { useAuth } from '../common/AuthContext';
import Sidebar from '../components/Sidebar';
import { YEAR_OPTIONS } from '../common/constants';
import { GoalCreateFormFields } from '../components/goals/GoalCreateFormFields';
import { useGoalDraft } from '../components/goals/useGoalDraft';
import {
  createGoal,
  deleteGoal as apiDeleteGoal,
  fetchGoals as apiFetchGoals,
  updateGoal as apiUpdateGoal,
} from '../api/goalsApi';

export default function GoalsPage() {
  const years = YEAR_OPTIONS;
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [detailGoal, setDetailGoal] = useState<IGoal | null>(null);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [deleteGoal, setDeleteGoal] = useState<IGoal | null>(null);
  const [editGoal, setEditGoal] = useState<IGoal | null>(null);
  const [goals , setGoals] = useState<IGoal[]>([]);
  const { auth } = useAuth();
  const { draft, setField, onDurationTypeChange, onStartDateChange, reset } = useGoalDraft();

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
        is_locked : false
      };

      const { result } = await createGoal(token, newGoal);
      
      setGoals((prev) => [...prev, result.data]);
      reset();
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
      const { result } = await apiUpdateGoal(auth.token, editGoal.id, editGoal);
      setGoals(prev => prev.map(g => g.id === result.data.id ? result.data : g));
      setEditGoal(null);
    } catch (err) {
      console.error('Error updating goal:', err);
    }
  }

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const token = auth.token;
        const { result } = await apiFetchGoals(token);
        setGoals(result.data);
        setDetailGoal(null);
      } catch (err) {
        console.error('Error fetching goals:', err);
      }
    };

    loadGoals();
  }, [auth.token]);

  const filteredGoals = goals.filter(
    (g) =>
      g.year === Number(selectedYear)
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Goals</h1>
        <div className="flex space-x-6 mb-6">
          <Dropdown
              label="Year"
              value={selectedYear}
              options={years}
              onChange={setSelectedYear}
            />
        </div>

        <button
          className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark mb-6"
          onClick={() => setIsAddGoalOpen(true)}
        >
          + Add Goal
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDetailClick={() => setDetailGoal(goal)}
              onDeleteClick={setDeleteGoal}
              onUpdateClick={setEditGoal}
            />
          ))}
        </div>

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
                options={['Draft','In Progress','Completed','Cancelled','Not started']}
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

        <Modal
          isOpen={isAddGoalOpen || !!detailGoal}
          title={detailGoal?.id ? 'Detail Goal' : 'Add Goal'}
          onClose={() => {
            setDetailGoal(null);
            setIsAddGoalOpen(false);
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
            </div>
          ) : (
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
          )}
        </Modal>
      </main>
      
    </div>
  );
}