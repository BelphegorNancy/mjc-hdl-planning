import React from 'react';
import { Search, X } from 'lucide-react';
import type { Room, Activity } from '../types';
import Button from './Button';
import { cn } from '../utils/cn';

interface SearchFiltersProps {
  rooms: Room[];
  activities: Activity[];
  filters: {
    date: string;
    roomId: string;
    activityId: string;
    searchTerm: string;
  };
  onFiltersChange: (filters: {
    date: string;
    roomId: string;
    activityId: string;
    searchTerm: string;
  }) => void;
  className?: string;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  rooms,
  activities,
  filters,
  onFiltersChange,
  className
}) => {
  const handleChange = (key: keyof typeof filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFiltersChange({
      date: '',
      roomId: '',
      activityId: '',
      searchTerm: '',
    });
  };

  return (
    <div className={cn("bg-white rounded-lg w-full", className)}>
      <div className="flex items-center gap-2">
        <div className="w-64">
          <div className="relative">
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => handleChange('searchTerm', e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-8 pr-2 py-1 border rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
            />
            <Search className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="w-40">
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full px-2 py-1 border rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        <div className="w-48">
          <select
            value={filters.roomId}
            onChange={(e) => handleChange('roomId', e.target.value)}
            className="w-full px-2 py-1 border rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Toutes les salles</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-48">
          <select
            value={filters.activityId}
            onChange={(e) => handleChange('activityId', e.target.value)}
            className="w-full px-2 py-1 border rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Toutes les activités</option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.name}
              </option>
            ))}
          </select>
        </div>

        {(filters.date || filters.roomId || filters.activityId || filters.searchTerm) && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;