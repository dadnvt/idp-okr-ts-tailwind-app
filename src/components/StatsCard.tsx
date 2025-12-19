import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';

interface StatsCardProps {
  title: string;
  stat: string | number;
  icon: React.ElementType;
  tooltip?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, stat, icon: Icon, tooltip }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition duration-300">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <span title={tooltip || undefined}>{title}</span>
          {tooltip && (
            <span
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help"
              title={tooltip}
              aria-label="Tooltip"
            >
              <FaInfoCircle className="w-3.5 h-3.5" />
            </span>
          )}
        </p>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stat}</p>
      </div>
      <Icon className="w-10 h-10 text-brand opacity-60" />
    </div>
  </div>
);

export default StatsCard;
