import { useState, useEffect } from 'react';
import GoalCard from '../components/GoalCard';
import Modal from '../common/Modal';
import type { IGoal } from '../types';
import Dropdown from '../components/Dropdown';
import { useAuth } from '../common/AuthContext';
import Sidebar from '../components/Sidebar';
import { Input } from '../components/Input';
import { getHalfYearRollingEnd, getQuarter, getQuarterEnd } from '../common/Utility';
import { DateInput } from '../components/DateInput';
import { NumberInput } from '../components/NumberInput';
import { Textarea } from '../components/Textarea';

export default function GoalsPage() {
  const years = Array.from({ length: 6 }, (_, i) => 2025 + i);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);
  const [deleteGoal, setDeleteGoal] = useState<IGoal | null>(null);
  const [editGoal, setEditGoal] = useState<IGoal | null>(null);
  const [goals , setGoals] = useState<IGoal[]>([]);
  const { auth } = useAuth();
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
        duration_type : durationType,
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
        is_locked : false
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

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const token = auth.token;
        const res = await fetch(`http://localhost:3000/goals`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await res.json();
        setGoals(result.data);
        setSelectedGoal(null);
      } catch (err) {
        console.error('Error fetching goals:', err);
      }
    };

    fetchGoals();
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
          onClick={() => setSelectedGoal({} as IGoal)}
        >
          + Add Goal
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDetailClick={() => setSelectedGoal(goal)}
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
          isOpen={!!selectedGoal}
          title={selectedGoal?.id ? 'Detail Goal' : 'Add Goal'}
          onClose={() => setSelectedGoal(null)}
        >
          {selectedGoal?.id ? (
            <div className="space-y-2">
              <p>
                <strong>Goal Title:</strong> {selectedGoal.name}
              </p>
              <p>
                <strong>Skill:</strong> {selectedGoal.skill}
              </p>
              <p>
                <strong>Progress:</strong> {selectedGoal.progress}%
              </p>
              <p>
                <strong>Status:</strong> {selectedGoal.status}
              </p>
            </div>
          ) : (
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
          )}
        </Modal>
      </main>
      
    </div>
  );
}