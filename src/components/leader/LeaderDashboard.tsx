import { FaBullseye, FaClipboardList, FaUsers } from 'react-icons/fa';
import ReviewGoalModal from './ReviewGoalModal';
import { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import type { IGoal } from '../../types';
import Sidebar from '../Sidebar';
import StatsCard from '../StatsCard';
import { useAuth } from '../../common/AuthContext';
import LeaderGoalCard from './LeaderGoalCard';

export default function LeaderDashboard() {
  const { auth } = useAuth();
  const [goals, setGoals] = useState<IGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<IGoal | null>(null);
  const [reviewGoal, setReviewGoal] = useState<IGoal | null>(null);


  useEffect(() => {
    const fetchGoals = async () => {
      const res = await fetch('http://localhost:3000/leader/goals', {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      const result = await res.json();
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
          Theo dõi & đánh giá goals của team 👥
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <StatsCard title="Goals chờ review" stat={pending} icon={FaBullseye} />
          <StatsCard title="Goals đã duyệt" stat={approved} icon={FaClipboardList} />
          <StatsCard title="Tiến độ TB" stat={`${avgProgress.toFixed(1)}%`} icon={FaUsers} />
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
            title="Chi tiết Goal"
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
              await fetch(
                `http://localhost:3000/leader/goals/${reviewGoal.id}/review`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${auth.token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(review),
                }
              );

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