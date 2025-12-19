import type { IGoal } from '../../types';
import { Button } from '../Button';

interface Props {
  goal: IGoal;
  onReviewClick: (goal: IGoal) => void;
  onDetailClick: (goal: IGoal) => void;
}

export default function LeaderGoalCard({ goal, onReviewClick, onDetailClick }: Props) {
  const memberLabel = goal.user_name || goal.user_email;
  const isApproved = goal.review_status === 'Approved';
  return (
    <div className="bg-white rounded-xl p-5 shadow flex flex-col justify-between">
      <div>
        <h3 className="font-bold text-lg">{goal.name}</h3>
        <p className="text-sm text-gray-500">{memberLabel}</p>
        {goal.team && <p className="text-xs text-gray-400 mt-1">Team: {goal.team}</p>}

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

      {isApproved ? (
        <Button onClick={() => onDetailClick(goal)} variant="secondary" fullWidth className="mt-4">
          View details
        </Button>
      ) : (
        <Button onClick={() => onReviewClick(goal)} variant="primary" fullWidth className="mt-4">
          Review
        </Button>
      )}
    </div>
  );
}
