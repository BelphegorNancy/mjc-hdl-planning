import React from 'react';
import { useStore } from '../store/useStore';
import { Activity } from '../types';

interface ActivityFiltersProps {
  visibleActivities: Set<string>;
  onActivityToggle: (activityId: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  visibleActivities,
  onActivityToggle,
  onSelectAll,
  onSelectNone,
}) => {
  const { activities } = useStore();

  return (
    <div>
      <div className="flex justify-end space-x-4 mb-4">
        <button
          onClick={onSelectAll}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Tout sélectionner
        </button>
        <button
          onClick={onSelectNone}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Tout désélectionner
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {activities.map((activity) => (
          <label key={activity.id} className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded cursor-pointer">
            <input
              type="checkbox"
              checked={visibleActivities.has(activity.id)}
              onChange={() => onActivityToggle(activity.id)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: activity.color }}
              />
              <span className="text-sm text-gray-700">{activity.name}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ActivityFilters;
