import React from 'react';

interface StatsCardProps {
  title: string;
  stat: string | number;
  icon: React.ElementType;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, stat, icon: Icon }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition duration-300">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stat}</p>
      </div>
      <Icon className="w-10 h-10 text-brand opacity-60" />
    </div>
  </div>
);

export default StatsCard;
