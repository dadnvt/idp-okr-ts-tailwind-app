import { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from '../common/Modal';
import type { IActionPlan, IGoal } from '../types';
import { ActionPlanDetail } from '../components/ActionPlanDetail';
import { CreateActionPlanForm } from '../components/CreateActionPlanForm';
import Dropdown from '../components/Dropdown';
import { useAuth } from '../common/AuthContext';
import { getGoalHealth } from '../common/Utility';
import { YEAR_OPTIONS } from '../common/constants';
import { createActionPlan, fetchActionPlansByYear } from '../api/actionPlansApi';

export default function ActionPlansPage() {
  const { auth } = useAuth();
  const years = YEAR_OPTIONS;
  const [goals, setGoals] = useState<IGoal[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<IActionPlan | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedGoal, setSelectedGoal] = useState<IGoal | null>(null);
  const lastFetchKeyRef = useRef<string | null>(null);

  const fetchGoals = async () => {
    try {
      const token = auth.token;
      if (!token) return;
      const { result } = await fetchActionPlansByYear(token, selectedYear);
      setGoals(result.data);
    } catch (err) {
      console.error('Error fetching goals:', err);
    }
  };

  useEffect(() => {
    if (!auth.token) return;

    // In React StrictMode (dev), effects can run twice on mount to surface side-effects.
    // Dedupe identical fetches for the same (token, year) key.
    const key = `${auth.token}:${selectedYear}`;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;

    fetchGoals();
  }, [auth.token, selectedYear]);

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
      alert('Err Action Plan');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 gap-2">
      <Sidebar />
      <main className="flex-1 p-8 gap-6 flex flex-col">
        {/* Year filter */}
        <Dropdown
          label="Year"
          value={selectedYear}
          options={years}
          onChange={setSelectedYear}
        />

        {/* Goals */}
        <div className="space-y-6">
          {goals
            .filter(g => g.year === selectedYear)
            .map(goal => {
              const health = getGoalHealth(goal);
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

                    {goal.status !== 'Not started' && (
                      <button
                        className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
                        onClick={() => setSelectedGoal(goal)}
                      >
                        + Add Action Plan
                      </button>
                    )}
                  </div>

                  {/* Goal Status */}
                  <div className="mb-4">
                    {goal.is_locked && (
                      <div className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300 px-3 py-1 rounded-full w-fit mb-2">
                        Leader complete Review
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
                      {goal.action_plans?.map(plan => (
                        <div
                          key={plan.id}
                          className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => setSelectedPlan(plan)}
                        >
                          <h5 className="font-semibold text-gray-800 dark:text-white">{plan.activity}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Status: {plan.status} • Deadline: {plan.end_date}
                          </p>
                        </div>
                      ))}
                      {goal.action_plans?.length === 0 && (
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
            <ActionPlanDetail plan={selectedPlan} />
          </Modal>
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