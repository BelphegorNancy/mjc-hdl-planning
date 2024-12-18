import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Edit2, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Reservation } from '../types';

interface ReservationCardProps {
  reservation: Reservation;
  onEdit: () => void;
  onDelete: () => void;
  span: number;
  position: {
    index: number;
    total: number;
  };
}

const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  onEdit,
  onDelete,
  span,
  position,
}) => {
  const { rooms, activities, currentUser } = useStore();
  const room = rooms.find((r) => r.id === reservation.roomId);
  const activity = activities.find((a) => a.id === reservation.activityId);
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  if (!room || !activity) return null;

  const width = `${100 / position.total}%`;
  const left = `${(position.index * 100) / position.total}%`;
  
  // Hauteur de base d'une cellule de 30 minutes (h-12 = 3rem = 48px)
  const CELL_HEIGHT = 48;
  const BORDER_ADJUSTMENT = 16;
  
  // Calculer si la réservation se termine sur une demi-heure
  const endsOnHalfHour = reservation.endTime.getMinutes() === 30;
  
  // Ajuster la hauteur en fonction de la fin sur une demi-heure
  const heightAdjustment = endsOnHalfHour ? BORDER_ADJUSTMENT : 0;
  
  // Hauteur totale avec ajustement précis
  const height = `${(span * CELL_HEIGHT) + heightAdjustment}px`;

  return (
    <div
      className="absolute z-10 p-1 rounded shadow-sm overflow-hidden group"
      style={{
        height,
        width,
        left,
        top: '0px',
        backgroundColor: `${room.color}20`,
        borderLeft: `3px solid ${room.color}`,
      }}
    >
      <div className="font-medium text-xs truncate">{activity.name}</div>
      <div className="text-xs text-gray-600 truncate">{room.name}</div>
      <div className="text-xs text-gray-500">
        {format(reservation.startTime, 'HH:mm', { locale: fr })} - {format(reservation.endTime, 'HH:mm', { locale: fr })}
      </div>
      {canEdit && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 rounded-full bg-white shadow-sm hover:bg-gray-100"
          >
            <Edit2 className="h-3 w-3 text-blue-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded-full bg-white shadow-sm hover:bg-gray-100"
          >
            <Trash2 className="h-3 w-3 text-red-600" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReservationCard;