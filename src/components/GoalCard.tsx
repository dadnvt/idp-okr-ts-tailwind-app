import { FaArrowRight, FaEdit, FaTrash } from 'react-icons/fa';
import type { IGoal } from '../types';
import { getGoalHealth, getHalfYearLabel, getQuarterFromDate } from '../common/Utility';
import { Button } from './Button';

interface GoalCardProps {
  goal: IGoal;
  onDetailClick: (goal: IGoal) => void;
  onDeleteClick: (goal: IGoal) => void;
  onUpdateClick: (goal: IGoal) => void;
  showActions?: boolean;
}

export default function GoalCard({
  goal,
  onDetailClick,
  onDeleteClick,
  onUpdateClick,
  showActions = true,
}: GoalCardProps) {
  const progressColor = goal.progress === 100 ? 'bg-green-500' : (goal.progress > 0 ? 'bg-brand' : 'bg-gray-300');
  const typeBg = goal.type === 'Hard' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800';
  const lateBg = new Date(goal.time_bound) < new Date() ? 'bg-red-100 text-red-800 font-bold' : '';
  const renderDuration = () => {
    if (goal.duration_type === 'Quarter') {
      const quarter = getQuarterFromDate(goal.start_date);
      const year = new Date(goal.start_date).getFullYear();
      return `Quarter ${quarter}-${year}`;
    }
    if (goal.duration_type === 'HalfYear') {
      return getHalfYearLabel(goal.start_date, goal.time_bound);
    }
    return '';
  };

  const health = getGoalHealth(goal);

  return (
    <div
      className={`p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 
                  hover:shadow-2xl hover:scale-[1.02] transition duration-300 relative group
                  ${goal.is_locked ? 'bg-red-50 dark:bg-red-900/20 border-red-300' : 'bg-white dark:bg-gray-800'}`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${typeBg}`}>
          {goal.type}
        </span>

        <span className={`text-xs font-semibold px-2 py-1 rounded-full`}>
          {renderDuration()}
        </span>

        <p className={`text-sm text-gray-500 dark:text-gray-400 ${lateBg}`}>
          Deadline: {goal.time_bound}
        </p>
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
        {goal.name}
      </h3>

      {goal.is_locked && (
        <div className="flex items-center text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300 px-3 py-1 rounded-full w-fit mb-3">
          {goal.review_status === 'Pending'
            ? 'Review requested (locked)'
            : goal.review_status === 'Approved'
              ? 'Approved (locked)'
              : 'Locked'}
        </div>
      )}

      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Progress: {goal.progress}% <br />
        Goal Status: {goal.status} <br />
      </p>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Review Status: {goal.review_status}
      </p>
      <p className="text-sm font-medium mb-2">
        Health:
        {health === "On Track" && <span className="text-green-600">🟢 On Track</span>}
        {health === "At Risk" && <span className="text-orange-600">🟠 At Risk</span>}
        {health === "High Risk" && <span className="text-red-600">🔴 High Risk</span>}
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
        <div
          className={`h-2.5 rounded-full ${progressColor}`}
          style={{ width: `${goal.progress}%` }}
        ></div>
      </div>

      <div className='flex justify-between gap-2'>
        <Button
          onClick={() => onDetailClick(goal)}
          variant="ghost"
          size="sm"
          className="flex items-center text-brand hover:text-brand-dark mt-2"
        >
          View details
          <FaArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition duration-200" />
        </Button>

        <div className='flex gap-1'>
          {showActions && !goal.is_locked && goal.status === 'Not started' && (
            <Button
              onClick={() => onDeleteClick(goal)}
              variant="ghost"
              size="sm"
              className="flex items-end text-brand hover:text-brand-dark mt-2"
            >
              <FaTrash className="ml-2 w-3 h-3 group-hover:translate-x-1 transition duration-200" />
            </Button>
          )}

          {showActions && goal.status !== 'Cancelled' && (
            <Button
              onClick={() => onUpdateClick(goal)}
              variant="ghost"
              size="sm"
              title={
                goal.is_locked
                  ? 'Goal is locked — progress updates are only allowed after leader approval'
                  : 'Edit / Update progress'
              }
              className="flex items-center text-brand hover:text-brand-dark mt-2"
            >
              <FaEdit className="w-3 h-3" />
              <span className="ml-2 text-xs font-semibold">
                {goal.status === 'Not started' && !goal.is_locked ? 'Edit' : 'Update progress'}
              </span>
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}
