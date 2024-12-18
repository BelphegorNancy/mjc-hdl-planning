import React from 'react';
import { format as formatDate, addDays, startOfWeek, getWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import type { PrintOptions } from './PrintModal';

interface PrintableCalendarProps {
  options: PrintOptions;
}

const PrintableCalendar: React.FC<PrintableCalendarProps> = ({ options }) => {
  const { reservations, rooms, activities } = useStore();
  const timeSlots = React.useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 21; hour++) {
      slots.push({ hour, minutes: 0 });
      slots.push({ hour, minutes: 30 });
    }
    return slots;
  }, []);

  const filteredReservations = React.useMemo(() => {
    return reservations.filter(res => 
      !options.roomId || res.roomId === options.roomId
    );
  }, [reservations, options.roomId]);

  const weekDays = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => 
      addDays(startOfWeek(options.startDate, { weekStartsOn: 1 }), i)
    );
  }, [options.startDate]);

  const weekNumber = getWeek(options.startDate, { weekStartsOn: 1 });

  const getReservationsForSlot = (day: Date, hour: number, minutes: number) => {
    return filteredReservations.filter(res => {
      const resDate = new Date(res.startTime);
      return formatDate(resDate, 'yyyy-MM-dd') === formatDate(day, 'yyyy-MM-dd') &&
             resDate.getHours() === hour &&
             resDate.getMinutes() === minutes;
    });
  };

  return (
    <div className={`print-preview ${options.format.toLowerCase()} ${options.orientation}`}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Planning Hebdomadaire</h1>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Semaine {weekNumber}</span> •{' '}
          {options.roomId && (
            <span>
              {rooms.find(r => r.id === options.roomId)?.name} •{' '}
            </span>
          )}
          <span>
            Du {formatDate(weekDays[0], 'd MMMM', { locale: fr })} au{' '}
            {formatDate(weekDays[6], 'd MMMM yyyy', { locale: fr })}
          </span>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
          <div className="p-4 border-b border-r border-gray-200">
            Horaires
          </div>
          {weekDays.map(day => (
            <div 
              key={day.toISOString()} 
              className="p-4 text-center border-b border-r border-gray-200"
            >
              <div className="font-semibold">
                {formatDate(day, 'EEEE', { locale: fr })}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(day, 'd MMMM', { locale: fr })}
              </div>
            </div>
          ))}
        </div>

        <div className="divide-y divide-gray-200">
          {timeSlots.map(({ hour, minutes }) => (
            <div 
              key={`${hour}-${minutes}`}
              className="grid" 
              style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}
            >
              <div className="p-2 text-sm text-gray-500 border-r border-gray-200 text-right pr-4">
                {formatDate(new Date().setHours(hour, minutes), 'HH:mm')}
              </div>
              {weekDays.map(day => {
                const slotReservations = getReservationsForSlot(day, hour, minutes);
                return (
                  <div
                    key={day.toISOString()}
                    className="border-r border-gray-200 p-1 min-h-[3rem] relative"
                  >
                    {slotReservations.map(reservation => {
                      const room = rooms.find(r => r.id === reservation.roomId);
                      const activity = activities.find(a => a.id === reservation.activityId);
                      if (!room || !activity) return null;

                      const duration = (
                        (reservation.endTime.getHours() * 60 + reservation.endTime.getMinutes()) -
                        (reservation.startTime.getHours() * 60 + reservation.startTime.getMinutes())
                      ) / 30;

                      return (
                        <div
                          key={reservation.id}
                          className="absolute inset-x-0 z-10 p-1 mx-1 rounded shadow-sm"
                          style={{
                            height: `${duration * 1.5}rem`,
                            backgroundColor: `${room.color}20`,
                            borderLeft: `3px solid ${room.color}`,
                          }}
                        >
                          <div className="text-xs font-medium truncate">{activity.name}</div>
                          <div className="text-xs text-gray-600 truncate">{room.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(reservation.startTime, 'HH:mm')} - {formatDate(reservation.endTime, 'HH:mm')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrintableCalendar;