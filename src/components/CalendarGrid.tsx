import React from 'react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Room, Reservation } from '../types';

interface CalendarGridProps {
  days: Date[];
  rooms: Room[];
  reservations: Reservation[];
  onCellClick: (date: Date, hour: number, minutes: number, room: Room) => void;
  onReservationClick?: (reservation: Reservation) => void;
  onReservationDrop?: (reservation: Reservation, newStartTime: Date) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  rooms,
  reservations,
  onCellClick,
  onReservationClick,
  onReservationDrop
}) => {
  const [draggedReservation, setDraggedReservation] = React.useState<Reservation | null>(null);
  const [dragStartY, setDragStartY] = React.useState<number>(0);
  const [dragStartX, setDragStartX] = React.useState<number>(0);
  const [dragStartTime, setDragStartTime] = React.useState<Date | null>(null);
  const [dragOffset, setDragOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const gridRef = React.useRef<HTMLDivElement>(null);
  const dayWidth = React.useRef<number>(0);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!draggedReservation || !dragStartTime || !gridRef.current) return;

    const cellHeight = 30;
    const deltaY = e.clientY - dragStartY;
    const deltaX = e.clientX - dragStartX;
    
    // Calculer le déplacement vertical (heures)
    const halfHourBlocks = Math.round(deltaY / cellHeight);
    const deltaMinutes = halfHourBlocks * 30;
    const offsetY = halfHourBlocks * cellHeight;

    // Calculer le déplacement horizontal (jours)
    if (dayWidth.current === 0) {
      const dayElements = gridRef.current.querySelectorAll('[data-day]');
      if (dayElements.length > 0) {
        dayWidth.current = dayElements[0].getBoundingClientRect().width;
      }
    }

    const dayDelta = Math.round(deltaX / dayWidth.current);
    const offsetX = dayDelta * dayWidth.current;

    const newStartTime = new Date(dragStartTime);
    newStartTime.setMinutes(dragStartTime.getMinutes() + deltaMinutes);
    newStartTime.setDate(dragStartTime.getDate() + dayDelta);

    const hours = newStartTime.getHours();
    const minutes = newStartTime.getMinutes();

    if (hours >= 8 && (hours < 24 || (hours === 0 && minutes === 0))) {
      setDragOffset({ x: offsetX, y: offsetY });
      document.body.style.cursor = 'move';
    }
  }, [draggedReservation, dragStartTime, dragStartY, dragStartX, gridRef]);

  const handleMouseUp = React.useCallback((e: MouseEvent) => {
    if (!draggedReservation || !dragStartTime || !gridRef.current) return;

    const cellHeight = 30;
    const deltaY = e.clientY - dragStartY;
    const deltaX = e.clientX - dragStartX;

    // Si le déplacement est minime, considérer comme un clic
    const minDragDistance = 5; // pixels
    if (Math.abs(deltaX) < minDragDistance && Math.abs(deltaY) < minDragDistance) {
      setDraggedReservation(null);
      setDragStartY(0);
      setDragStartX(0);
      setDragStartTime(null);
      setDragOffset({ x: 0, y: 0 });
      document.body.style.cursor = 'default';
      return;
    }

    const halfHourBlocks = Math.round(deltaY / cellHeight);
    const deltaMinutes = halfHourBlocks * 30;

    const dayDelta = Math.round(deltaX / dayWidth.current);

    const newStartTime = new Date(dragStartTime);
    newStartTime.setMinutes(dragStartTime.getMinutes() + deltaMinutes);
    newStartTime.setDate(dragStartTime.getDate() + dayDelta);

    const hours = newStartTime.getHours();
    const minutes = newStartTime.getMinutes();

    if (hours >= 8 && (hours < 24 || (hours === 0 && minutes === 0))) {
      onReservationDrop?.(draggedReservation, newStartTime);
    }

    setDraggedReservation(null);
    setDragStartY(0);
    setDragStartX(0);
    setDragStartTime(null);
    setDragOffset({ x: 0, y: 0 });
    document.body.style.cursor = 'default';
  }, [draggedReservation, dragStartTime, dragStartY, dragStartX, onReservationDrop]);

  const handleReservationMouseDown = React.useCallback((e: React.MouseEvent, reservation: Reservation) => {
    e.stopPropagation();
    setDraggedReservation(reservation);
    setDragStartY(e.clientY);
    setDragStartX(e.clientX);
    setDragStartTime(reservation.startTime);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const timeSlots = React.useMemo(() => {
    const slots = [];
    slots.push({ hour: -1, minutes: 0 }); // Ligne d'en-tête
    // De 8h à 23h
    for (let hour = 8; hour <= 23; hour++) {
      slots.push({ hour, minutes: 0 });
      slots.push({ hour, minutes: 30 });
    }
    // Ajouter minuit (0h)
    slots.push({ hour: 0, minutes: 0 });
    return slots;
  }, []);

  const handleCellClick = (day: Date, slot: { hour: number, minutes: number }, room: Room) => {
    console.log('Cell clicked:', { day, slot, room });
    // Ne pas traiter la ligne d'en-tête
    if (slot.hour === -1) {
      return;
    }
    
    // Si c'est minuit (0h), on l'ajoute au jour suivant
    const clickedDate = new Date(day);
    if (slot.hour === 0) {
      clickedDate.setDate(clickedDate.getDate() + 1);
    }
    clickedDate.setHours(slot.hour, slot.minutes, 0, 0);
    onCellClick(clickedDate, slot.hour, slot.minutes, room);
  };

  const calculatePosition = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Si c'est minuit, c'est la dernière ligne
    if (hours === 0) {
      return (timeSlots.length - 1) * 40;
    }
    
    // Sinon, calculer la position en fonction de l'heure
    const index = ((hours - 8) * 2) + (minutes >= 30 ? 2 : 1);
    return index * 40;
  };

  const calculateHeight = (start: Date, end: Date) => {
    const startHours = start.getHours();
    const startMinutes = start.getMinutes();
    const endHours = end.getHours();
    const endMinutes = end.getMinutes();
    
    // Convertir en index
    const startIndex = startHours === 0 
      ? timeSlots.length - 1 
      : ((startHours - 8) * 2) + (startMinutes >= 30 ? 2 : 1);
      
    const endIndex = endHours === 0 
      ? timeSlots.length - 1 
      : ((endHours - 8) * 2) + (endMinutes >= 30 ? 2 : 1);
    
    return (endIndex - startIndex) * 40;
  };

  const getReservationsForDay = (date: Date) => {
    return reservations.filter(reservation => {
      const startDate = new Date(reservation.startTime);
      return isSameDay(startDate, date);
    }).sort((a, b) => {
      // Trier d'abord par salle
      if (a.room.id !== b.room.id) {
        return a.room.id.localeCompare(b.room.id);
      }
      // Puis par heure de début
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  };

  const getOverlappingReservations = (reservation: Reservation, dayReservations: Reservation[]) => {
    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);
    
    return dayReservations.filter(other => {
      if (other.id === reservation.id) return false;
      const otherStart = new Date(other.startTime);
      const otherEnd = new Date(other.endTime);
      return start < otherEnd && end > otherStart;
    });
  };

  const calculateReservationStyle = (reservation: Reservation, dayReservations: Reservation[]) => {
    const overlapping = getOverlappingReservations(reservation, dayReservations);
    if (overlapping.length === 0) {
      return {
        left: '4px',
        right: '4px',
        width: 'auto'
      };
    }

    const index = [...overlapping, reservation]
      .sort((a, b) => a.room.name.localeCompare(b.room.name))
      .findIndex(r => r.id === reservation.id);
    
    const width = `calc((100% - 8px) / ${overlapping.length + 1})`;
    const left = `calc(${index} * ${width} + 4px)`;

    return {
      width,
      left,
      right: 'auto'
    };
  };

  React.useEffect(() => {
    if (draggedReservation) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedReservation, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={gridRef}
      className="flex-1 overflow-auto"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="grid" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}>
        {/* En-tête vide pour la colonne des heures */}
        <div className="h-14 sticky top-0 z-20 bg-white border-b" />

        {/* En-têtes des jours */}
        {days.map((day, index) => (
          <div 
            key={day.toISOString()} 
            className="h-14 sticky top-0 z-20 border-b border-l border-gray-200 bg-white"
            data-day
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-xs text-gray-500">
                {format(day, 'EEE', { locale: fr }).toUpperCase()}
              </div>
              <div className={`text-xl font-semibold ${isSameDay(day, new Date()) ? 'bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="text-xs text-gray-500">
                {format(day, 'MMM', { locale: fr })}
              </div>
            </div>
          </div>
        ))}

        {/* Colonne des heures */}
        <div className="sticky left-0 z-10 bg-white">
          {timeSlots.map((slot, index) => (
            <div
              key={`time-${slot.hour}-${slot.minutes}`}
              className={`flex items-center justify-end pr-2 text-xs text-gray-500`}
              style={{ 
                height: '40px',
                transform: 'translateY(-50%)'
              }}
            >
              {slot.hour !== -1 && (
                slot.minutes === 0 ? `${slot.hour.toString().padStart(2, '0')}:00` : `${slot.hour.toString().padStart(2, '0')}:30`
              )}
            </div>
          ))}
        </div>

        {/* Colonnes des jours */}
        {days.map(day => (
          <div key={day.toISOString()} className="relative">
            {/* Lignes de fond pour les heures */}
            {timeSlots.map((slot, index) => (
              <div
                key={`grid-${slot.hour}-${slot.minutes}`}
                className={`border-l ${
                  slot.hour === -1 
                    ? 'border-b-2 border-gray-300' 
                    : slot.minutes === 30 
                      ? 'border-b-2 border-gray-300'
                      : 'border-b border-gray-200'
                } cursor-pointer hover:bg-gray-50`}
                style={{ 
                  height: '40px',
                  width: '100%',
                  position: 'relative',
                  zIndex: 1
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCellClick(day, slot, rooms[0]);
                }}
              >
                <div 
                  className="absolute inset-0" 
                  style={{ pointerEvents: 'none' }}
                />
              </div>
            ))}

            {/* Réservations */}
            {getReservationsForDay(day).map(reservation => {
              const start = new Date(reservation.startTime);
              const end = new Date(reservation.endTime);
              const top = calculatePosition(start);
              const height = calculateHeight(start, end);
              const dayReservations = getReservationsForDay(day);
              const reservationStyle = calculateReservationStyle(reservation, dayReservations);

              return (
                <div
                  key={reservation.id}
                  className="absolute rounded-lg overflow-hidden cursor-pointer hover:brightness-95 shadow-sm"
                  onMouseDown={(e) => handleReservationMouseDown(e, reservation)}
                  style={{
                    position: 'absolute',
                    top: `${top + (draggedReservation?.id === reservation.id ? dragOffset.y : 0)}px`,
                    height: `${height}px`,
                    left: 0,
                    right: 0,
                    transform: draggedReservation?.id === reservation.id ? `translateX(${dragOffset.x}px)` : undefined,
                    backgroundColor: `${reservation.room.color}33` || '#E3E9FF',
                    borderLeft: '4px solid',
                    borderLeftColor: reservation.room.color || '#668CFF',
                    cursor: draggedReservation?.id === reservation.id ? 'move' : 'pointer',
                    ...reservationStyle,
                    zIndex: draggedReservation?.id === reservation.id ? 10 : 2,
                    transition: draggedReservation?.id === reservation.id ? 'none' : 'all 0.2s ease',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Clicked reservation:', reservation);
                    if (onReservationClick) {
                      onReservationClick(reservation);
                    }
                  }}
                >
                  <div className="p-1 h-full flex flex-col">
                    <div className="flex items-center space-x-1 mb-0.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: reservation.room.color }} />
                      <div className="text-xs font-bold text-gray-900 truncate">
                        {reservation.room.name}
                      </div>
                    </div>
                    <div className="text-xs text-gray-700 truncate">
                      {reservation.activity.name}
                    </div>
                    {reservation.title && reservation.title !== reservation.activity.name && (
                      <div className="text-xs truncate text-gray-600">
                        {reservation.title}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-auto">
                      {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;