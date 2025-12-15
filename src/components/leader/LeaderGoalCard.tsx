import type { IGoal } from '../../types';

interface Props {
  goal: IGoal;
  onReviewClick: (goal: IGoal) => void;
}

export default function LeaderGoalCard({ goal, onReviewClick }: Props) {
  return (
    <div className="bg-white rounded-xl p-5 shadow flex flex-col justify-between">
      <div>
        <h3 className="font-bold text-lg">{goal.name}</h3>
        <p className="text-sm text-gray-500">{goal.user_email}</p>

        <div className="mt-2 text-sm">
          <p>Progress: {goal.progress}%</p>
          <p>
            Review:{' '}
            <span className="font-semibold">
              {goal.review_status ?? 'pending'}
            </span>
          </p>
        </div>
      </div>

      <button
        onClick={() => onReviewClick(goal)}
        className="mt-4 w-full bg-brand text-white py-2 rounded hover:bg-brand-dark"
      >
        Review
      </button>
    </div>
  );
}
