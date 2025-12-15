import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from '../common/Modal';
import type { IActionPlan, IGoal, IWeeklyReport } from '../types';
import { ActionPlanDetail } from '../components/ActionPlanDetail';
import { CreateActionPlanForm } from '../components/CreateActionPlanForm';
import Dropdown from '../components/Dropdown';
import { useAuth } from '../common/AuthContext';

export default function ActionPlansPage() {
  const { auth } = useAuth();
  const years = Array.from({ length: 6 }, (_, i) => 2025 + i);
  const [goals, setGoals] = useState<IGoal[]>([]);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<IActionPlan | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedGoal, setSelectedGoal] = useState<IGoal | null>(null);

  // mock data – sau này replace bằng API
  const fetchGoals = async () => {
    try {
      const token = auth.token;
      const res = await fetch(`http://localhost:3000/goals?year=${selectedYear}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json();
      setGoals(result.data);
    } catch (err) {
      console.error('Error fetching goals:', err);
    }
  };
  
  useEffect(() => {
    fetchGoals();
  }, [auth.token]);

  const handleCreateActionPlan = async (payload: {
    goal_id: string;
    activity: string;
    start_date: string;
    end_date: string;
    owner : string;
    resourse: string;
    expected_outcome: string;
    status: string;
    evidence_link: string;
  }) => {
    try {
      const res = await fetch(`http://localhost:3000/goals/${selectedGoal?.id}/action-plans`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Create action plan failed');
      }

      setGoals(prev =>
        prev.map(g =>
          g.id === payload.goal_id
            ? {
                ...g,
                actionPlans: [...(g.actionPlans || []), result.data],
              }
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
      <main className="flex-1 p-8 gap-2 flex flex-col">
        <h1 className="text-3xl font-bold mb-6">Action Plans</h1>

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
            .map(goal => (
              
                <div key={goal.id}
                    className={`p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 
                                hover:shadow-2xl relative group
                                ${goal.is_locked ? 'bg-red-50 dark:bg-red-900/20 border-red-300' : 'bg-white dark:bg-gray-800'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className='text-xs font-semibold px-2 py-1 rounded-full'>
                        {goal.type}
                      </span>

                      <span className={`text-xs font-semibold px-2 py-1 rounded-full`}>
                        
                      </span>

                      <p className='text-sm text-gray-500 dark:text-gray-400'>
                        Deadline: {goal.time_bound}
                      </p>

                      <button
                        className="bg-brand text-white px-3 py-1 rounded"
                        onClick={() => setSelectedGoal(goal)}
                      >
                        + Add Action Plan
                      </button>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
                      {goal.name}
                    </h3>
                    
                    {goal.is_locked && (
                      <div className="flex items-center text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300 px-3 py-1 rounded-full w-fit mb-3">
                        Leader complete Review
                      </div>
                    )}

                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Progress: {goal.progress}% <br/>
                      Status: {goal.status}
                    </p>
                    
                    <div className='flex justify-between gap-2'>
                      <div className="divide-y">
                        {goal.actionPlans?.map(plan => (
                          <div
                            key={plan.id}
                            className="p-4 hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedPlan(plan)}
                          >
                            <h3 className="font-semibold">{plan.activity}</h3>
                            <p className="text-sm text-gray-600">
                              Status: {plan.status} • Deadline: {plan.end_date}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                      
                  </div>
            ))}
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
                // reload goals
                fetchGoals();
              }}
            />
          </Modal>
        )}

      </main>
    </div>
  );
}
