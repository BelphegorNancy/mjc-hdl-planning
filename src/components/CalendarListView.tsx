import React, { useRef } from 'react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, MapPin, BookOpen } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Reservation, Room } from '../types';

interface CalendarListViewProps {
  days: Date[];
  rooms: Room[];
  reservations: Reservation[];
  onReservationClick: (reservation: Reservation) => void;
}

const CalendarListView: React.FC<CalendarListViewProps> = ({
  days,
  rooms,
  reservations,
  onReservationClick,
}) => {
  const sortedReservations = React.useMemo(() => {
    return [...reservations]
      .map(reservation => ({
        ...reservation,
        startTime: new Date(reservation.startTime),
        endTime: new Date(reservation.endTime)
      }))
      .filter(reservation => 
        days.some(day => isSameDay(day, reservation.startTime))
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [reservations, days]);

  const groupedReservations = React.useMemo(() => {
    const groups: { [key: string]: Reservation[] } = {};
    sortedReservations.forEach(reservation => {
      const dateKey = format(reservation.startTime, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(reservation);
    });
    return groups;
  }, [sortedReservations]);

  const listRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async (elementRef: React.RefObject<HTMLElement>) => {
    if (!elementRef.current) return;

    const canvas = await html2canvas(elementRef.current, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a3');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 20;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save('planning-liste.pdf');
  };

  if (sortedReservations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune réservation pour cette période
      </div>
    );
  }

  return (
    <div className="p-4 calendar-list-container" ref={listRef}>
      <div className="mb-4">
        <div className="text-center">
          <h1 className="text-lg font-bold mb-2" style={{ letterSpacing: '0.5px' }}>
            {'Planning des réservations'}
          </h1>
          <div className="text-sm text-gray-600 mb-2" style={{ letterSpacing: '0.5px' }}>
            {`Du ${format(days[0], 'EEEE dd', { locale: fr })} au ${format(days[6], 'EEEE dd MMMM yyyy', { locale: fr })}`}
          </div>
          <div className="text-sm text-gray-600">
            {rooms.map((room, index) => (
              <span key={room.id}>
                {room.name}{index < rooms.length - 1 ? ' - ' : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {Object.entries(groupedReservations).map(([dateKey, dayReservations]) => (
          <div key={dateKey} className="space-y-2">
            <h3 className="font-medium text-lg" style={{ letterSpacing: '0.5px' }}>
              {format(new Date(dateKey), "EEEE dd MMMM yyyy", { locale: fr })}
            </h3>
            <div className="space-y-2">
              {dayReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  onClick={() => onReservationClick(reservation)}
                  className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4"
                  style={{ borderLeftColor: reservation.room.color || '#3B82F6' }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-lg">{reservation.title}</h4>
                      <p className="text-gray-600">{reservation.description}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(reservation.startTime, 'HH:mm')} - {format(reservation.endTime, 'HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{reservation.room.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{reservation.activity.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <button 
          onClick={() => exportToPDF(listRef)}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium print:hidden"
        >
          PDF
        </button>
      </div>
    </div>
  );
};

export default CalendarListView;