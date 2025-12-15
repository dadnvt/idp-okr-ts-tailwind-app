import { FaBullseye, FaCheckCircle, FaClipboardList, FaPlus } from 'react-icons/fa';
import StatsCard from './StatsCard';
import GoalCard from './GoalCard';
import type { IGoal } from '../types';
import { useState, useEffect } from 'react';
import Dropdown from './Dropdown';
import Sidebar from './Sidebar';
import Modal from '../common/Modal';
import { useAuth } from '../common/AuthContext';
import { DateInput } from './DateInput';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { NumberInput } from './NumberInput';
import { getQuarter, getQuarterEnd, getHalfYearRollingEnd } from '../common/Utility';

export default function MemberDashboard({ onDetailClick }: { onDetailClick: (goal: IGoal) => void }) {
  const { auth } = useAuth();
  const years = Array.from({ length: 6 }, (_, i) => 2025 + i);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);
  const [goals, setGoals] = useState<IGoal[]>([]);
  const [deleteGoal, setDeleteGoal] = useState<IGoal | null>(null);
  const [editGoal, setEditGoal] = useState<IGoal | null>(null);

  const filteredGoals = goals.filter(g => g.year === Number(selectedYear));
  const inProgressGoals = filteredGoals.filter(g => g.status === 'In Progress').length;
  const completedGoals = filteredGoals.filter(g => g.status === 'Completed').length;
  const failedGoals = filteredGoals.filter(g => new Date(g.time_bound) < new Date()).length;
  const totalGoals = filteredGoals.length;
  const avgProgress = totalGoals > 0 ? filteredGoals.reduce((sum, g) => sum + g.progress, 0) / totalGoals : 0;

  const [name, setTitle] = useState('');
  const [skill, setSkill] = useState('');
  const [time_bound, setDeadline] = useState('');
  const [type, setType] = useState('Soft');
  const [durationType, setDurationType] = useState('Quarter');
  const [progress, setProgress] = useState(0);
  const [specific, setSpecific] = useState('');
  const [measurable, setMeasurable] = useState('');
  const [achievable, setAchievable] = useState('');
  const [relevant, setRelevant] = useState('');
  const [start_date, setStartDate] = useState('');
  const [success_metric, setSuccessMetric] = useState('');
  const [status, setStatus] = useState('Not started');
  const [weight, setWeight] = useState(0);
  const [risk, setRisk] = useState('');
  const [dependencies, setDependencies] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const token = auth.token;
        const res = await fetch(`http://localhost:3000/goals`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        const result = await res.json();
        setGoals(result.data);
      } catch (err) {
        console.error('Error fetching goals:', err);
      }
    };

    fetchGoals();
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
        name,
        type,
        duration_type: durationType,
        skill,
        specific,
        measurable,
        achievable,
        relevant,
        start_date,
        time_bound,
        success_metric,
        status,
        weight,
        progress,
        risk,
        dependencies,
        notes,
        is_locked: false
      };

      const res = await fetch('http://localhost:3000/goals', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newGoal)
      });

      const result = await res.json();

      setShowCreateModal(false);
      setGoals((prev) => [...prev, result.data]);
    } catch (err) {
      console.error('Error creating goal:', err);
    }
  }

  async function handleDeleteGoal(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:3000/goals/${deleteGoal?.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

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
      const res = await fetch(`http://localhost:3000/goals/${editGoal?.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editGoal),
      });

      const result = await res.json();
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cột trái: SMART */}
                <div className="space-y-4">
                  <Input label="Goal Title" value={name} onChange={setTitle} />
                  <Input label="Skill" value={skill} onChange={setSkill} />
                  <div className='flex gap-2'>
                    <Dropdown label="Goal type" value={type} options={['Soft', 'Hard']} onChange={setType} />
                    <Dropdown
                      label="Goal Duration"
                      value={durationType}
                      options={['Quarter', 'HalfYear']}
                      onChange={(val) => {
                        setDurationType(val);

                        if (!start_date) return;

                        const start = new Date(start_date);

                        if (val === 'Quarter') {
                          const quarter = getQuarter(start.getMonth() + 1);
                          const quarterEnd = getQuarterEnd(start.getFullYear(), quarter);
                          setDeadline(quarterEnd.toISOString().split("T")[0]);
                        }

                        if (val === 'HalfYear') {
                          const halfYearEnd = getHalfYearRollingEnd(start);
                          setDeadline(halfYearEnd.toISOString().split("T")[0]);
                        }
                      }}
                    />
                  </div>
                  <Input label="Specific" value={specific} onChange={setSpecific} />
                  <Input label="Measurable" value={measurable} onChange={setMeasurable} />
                  <Input label="Achievable" value={achievable} onChange={setAchievable} />
                  <Input label="Relevant" value={relevant} onChange={setRelevant} />
                </div>

                {/* Cột phải: thời gian & tiến độ */}
                <div className="space-y-4">
                  <DateInput
                    label="Start Date"
                    value={start_date}
                    onChange={(val) => {
                      setStartDate(val);
                      const start = new Date(val);

                      if (durationType === 'Quarter') {
                        const quarter = getQuarter(start.getMonth() + 1);
                        const quarterEnd = getQuarterEnd(start.getFullYear(), quarter);
                        setDeadline(quarterEnd.toISOString().split("T")[0]);
                      }

                      if (durationType === 'HalfYear') {
                        const end = new Date(start);
                        end.setMonth(end.getMonth() + 6);
                        end.setDate(end.getDate() - 1);
                        setDeadline(end.toISOString().split("T")[0]);
                      }
                    }}
                  />
                  <DateInput label="Deadline" disabled={true} value={time_bound} onChange={setDeadline} />
                  <Input label="Success Metric" value={success_metric} onChange={setSuccessMetric} />
                  <Dropdown label="Status" value={status} options={['Draft', 'In Progress', 'Completed', 'Cancelled', 'Not started']} onChange={setStatus} />
                  <NumberInput label="Progress (%)" value={progress} onChange={setProgress} />
                  <NumberInput label="Weight (%)" value={weight} onChange={setWeight} />
                  <Input label="Risk" value={risk} onChange={setRisk} />
                  <Input label="Dependencies" value={dependencies} onChange={setDependencies} />
                  <Textarea label="Notes" value={notes} onChange={setNotes} />
                </div>
              </div>
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