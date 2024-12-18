import React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  addDays,
  isSameDay,
  setHours,
  setMinutes,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import '../styles/calendar-month.css';
import type { Reservation, Room } from '../types';

interface CalendarMonthViewProps {
  selectedDate: Date;
  reservations: Reservation[];
  onReservationClick?: (reservation: Reservation) => void;
  onCellClick?: (date: Date, hour: number, minutes: number, room: Room) => void;
  onDayClick?: (date: Date) => void;
  rooms: Room[];
}

const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({ 
  selectedDate, 
  reservations,
  onReservationClick,
  onCellClick,
  onDayClick,
  rooms 
}) => {
  // Obtenir le premier et dernier jour du mois
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  // Obtenir le premier jour de la première semaine et le dernier jour de la dernière semaine
  const calendarStart = startOfWeek(monthStart, { locale: fr, weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { locale: fr, weekStartsOn: 1 });

  // Obtenir tous les jours du calendrier
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Jours de la semaine en français
  const weekDays = eachDayOfInterval({
    start: calendarStart,
    end: addDays(calendarStart, 6),
  }).map(day => format(day, 'EEE', { locale: fr }));

  // Fonction pour obtenir les réservations d'un jour donné
  const getDayReservations = (day: Date) => {
    return reservations.filter(reservation => 
      isSameDay(new Date(reservation.startTime), day)
    );
  };

  // Gérer le clic sur une cellule pour créer une nouvelle réservation
  const handleCellClick = (day: Date) => {
    if (onCellClick && rooms.length > 0) {
      // Par défaut, on utilise la première salle disponible
      const defaultRoom = rooms[0];
      // On définit l'heure par défaut à 9h00
      const defaultHour = 9;
      const defaultMinutes = 0;
      
      onCellClick(day, defaultHour, defaultMinutes, defaultRoom);
    }
  };

  // Gérer le clic sur une journée
  const handleDayClick = (day: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    onDayClick?.(day);
  };

  return (
    <div className="month-view bg-white rounded-lg shadow">
      {/* En-tête du mois */}
      <div className="text-xl font-semibold p-4 text-center text-gray-800">
        {format(selectedDate, 'MMMM yyyy', { locale: fr })}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-gray-50 p-2 text-center font-semibold text-gray-600"
          >
            {day}
          </div>
        ))}
        {calendarDays.map((day, index) => {
          const dayReservations = getDayReservations(day);
          
          return (
            <div
              key={index}
              onClick={(e) => handleDayClick(day, e)}
              className={`min-h-[100px] p-2 flex flex-col cursor-pointer hover:bg-gray-50 ${
                isSameMonth(day, selectedDate)
                  ? 'bg-white'
                  : 'bg-gray-50 text-gray-400'
              } ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                ? 'relative'
                : ''
              }`}
            >
              <span className={`text-sm font-medium mb-1 ${
                format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center'
                  : ''
              }`}>
                {format(day, 'd', { locale: fr })}
              </span>
              
              <div className="flex-1 overflow-y-auto">
                {dayReservations.map((reservation, idx) => (
                  <div
                    key={reservation.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReservationClick?.(reservation);
                    }}
                    className="text-xs mb-1 p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: `${reservation.room.color}20`,
                      borderLeft: `3px solid ${reservation.room.color}`,
                    }}
                    title={`${reservation.room.name} - ${reservation.activity.name} (${format(new Date(reservation.startTime), 'HH:mm', { locale: fr })})`}
                  >
                    {format(new Date(reservation.startTime), 'HH:mm', { locale: fr })} - {reservation.room.name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonthView;
