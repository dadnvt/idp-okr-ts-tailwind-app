import { FaBullseye, FaClipboardList, FaUsers } from 'react-icons/fa';
import ReviewGoalModal from './ReviewGoalModal';
import { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import type { IGoal } from '../../types';
import Sidebar from '../Sidebar';
import StatsCard from '../StatsCard';
import { useAuth } from '../../common/AuthContext';
import LeaderGoalCard from './LeaderGoalCard';
import { fetchLeaderGoals, reviewLeaderGoal } from '../../api/leaderApi';

export default function LeaderDashboard() {
  const { auth } = useAuth();
  const [goals, setGoals] = useState<IGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<IGoal | null>(null);
  const [reviewGoal, setReviewGoal] = useState<IGoal | null>(null);


  useEffect(() => {
    const fetchGoals = async () => {
      const { result } = await fetchLeaderGoals(auth.token);
      setGoals(result.data);
    };
    fetchGoals();
  }, []);

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

        {/* Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {goals.map(goal => (
            <LeaderGoalCard
              key={goal.id}
              goal={goal}
              onReviewClick={setReviewGoal}
            />
          ))}
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