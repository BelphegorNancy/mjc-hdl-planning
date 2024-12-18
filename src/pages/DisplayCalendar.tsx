import React from 'react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStore } from '../store/useStore';

const DisplayCalendar = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { reservations, rooms, activities } = useStore();
  
  // Filtrer les réservations pour n'afficher que celles à partir d'aujourd'hui
  const filteredReservations = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reservations
      .map(reservation => ({
        ...reservation,
        startTime: new Date(reservation.startTime),
        endTime: new Date(reservation.endTime)
      }))
      .filter(reservation => reservation.startTime >= today);
  }, [reservations]);

  // Trier les réservations par date et heure
  const sortedReservations = React.useMemo(() => {
    return [...filteredReservations].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [filteredReservations]);

  // Grouper les réservations par jour
  const groupedReservations = React.useMemo(() => {
    const groups: { [key: string]: typeof reservations } = {};
    sortedReservations.forEach(reservation => {
      const dateKey = format(reservation.startTime, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(reservation);
    });
    return groups;
  }, [sortedReservations]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let scrollingDown = true;
    const scrollSpeed = 0.5; // Vitesse de défilement (pixels par frame)
    const pauseDuration = 3000; // Pause de 3 secondes en haut et en bas

    const scroll = () => {
      if (!container) return;

      if (scrollingDown) {
        container.scrollTop += scrollSpeed;
        
        // Si on atteint le bas
        if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
          scrollingDown = false;
          // Pause en bas avant de remonter
          setTimeout(() => {
            // Animation fluide pour remonter en haut
            container.style.scrollBehavior = 'smooth';
            container.scrollTop = 0;
            container.style.scrollBehavior = 'auto';
            
            // Pause en haut avant de redescendre
            setTimeout(() => {
              scrollingDown = true;
            }, pauseDuration);
          }, pauseDuration);
        }
      }

      animationFrameId = requestAnimationFrame(scroll);
    };

    // Démarrer l'animation
    animationFrameId = requestAnimationFrame(scroll);

    // Arrêter le scroll au survol
    const handleMouseEnter = () => {
      cancelAnimationFrame(animationFrameId);
    };

    const handleMouseLeave = () => {
      animationFrameId = requestAnimationFrame(scroll);
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container?.removeEventListener('mouseenter', handleMouseEnter);
      container?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Si aucune réservation n'est trouvée
  if (Object.keys(groupedReservations).length === 0) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
        <div className="text-3xl font-bold text-red-500">
          Aucune réservation à venir
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black text-white overflow-hidden"
    >
      <div className="p-8 space-y-8">
        {Object.entries(groupedReservations).map(([dateKey, dayReservations]) => (
          <div key={dateKey} className="space-y-4">
            <h2 className="text-3xl font-bold text-red-500 border-b border-red-500 pb-2">
              {format(new Date(dateKey), 'EEEE d MMMM yyyy', { locale: fr })}
            </h2>
            <div className="grid gap-4">
              {dayReservations.map(reservation => (
                <div 
                  key={reservation.id} 
                  className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 hover:border-red-500 transition-colors duration-300"
                >
                  <div className="flex items-start space-x-6">
                    {/* Horaires */}
                    <div className="w-48">
                      <div className="text-2xl font-bold text-red-400">
                        {format(reservation.startTime, 'HH:mm')}
                      </div>
                      <div className="text-xl text-gray-400">
                        {format(reservation.endTime, 'HH:mm')}
                      </div>
                    </div>

                    {/* Détails */}
                    <div className="flex-1">
                      <div className="text-2xl font-semibold mb-2">
                        {reservation.activity.name}
                      </div>
                      <div className="text-xl text-gray-400">
                        {reservation.room.name}
                      </div>
                      {reservation.title && (
                        <div className="mt-2 text-lg text-gray-300">
                          {reservation.title}
                        </div>
                      )}
                      {reservation.description && (
                        <div className="mt-1 text-gray-400">
                          {reservation.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DisplayCalendar;