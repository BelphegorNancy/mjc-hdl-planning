import React from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, isFriday, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStore } from '../store/useStore';

// Couleurs pour les différentes activités
const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-orange-500'
];

const Display = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { reservations } = useStore();

  // Map pour stocker les couleurs des activités
  const activityColors = React.useRef<Map<string, string>>(new Map());

  // Obtenir une couleur pour une activité
  const getActivityColor = (activityId: string) => {
    if (!activityColors.current.has(activityId)) {
      const colorIndex = activityColors.current.size % COLORS.length;
      activityColors.current.set(activityId, COLORS[colorIndex]);
    }
    return activityColors.current.get(activityId);
  };

  // Déterminer la semaine à afficher
  const targetWeek = React.useMemo(() => {
    const today = new Date();
    const shouldShowNextWeek = isFriday(today) || today.getDay() > 5;
    const baseDate = shouldShowNextWeek ? addWeeks(today, 1) : today;
    
    return {
      start: startOfWeek(baseDate, { weekStartsOn: 1 }),
      end: endOfWeek(baseDate, { weekStartsOn: 1 })
    };
  }, []);

  // Filtrer et trier les réservations
  const weekReservations = React.useMemo(() => {
    return reservations
      .map(reservation => ({
        ...reservation,
        startTime: new Date(reservation.startTime),
        endTime: new Date(reservation.endTime)
      }))
      .filter(reservation => 
        isWithinInterval(reservation.startTime, {
          start: targetWeek.start,
          end: targetWeek.end
        })
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [reservations, targetWeek]);

  // Effet pour le défilement automatique
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    const scrollSpeed = 1;
    let lastScrollTop = 0;
    let scrollStuckCount = 0;

    const scroll = () => {
      if (!container) return;

      // Vérifier si on a atteint le bas
      if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
        // Attendre un peu avant de remonter
        setTimeout(() => {
          if (container) {
            container.scrollTo({
              top: 0,
              behavior: 'instant'
            });
          }
        }, 1000); // Pause de 1 seconde avant de remonter
        
        // Réinitialiser les compteurs
        lastScrollTop = 0;
        scrollStuckCount = 0;
      } else {
        // Continuer le défilement normal
        container.scrollTop += scrollSpeed;

        // Détecter si on est bloqué
        if (container.scrollTop === lastScrollTop) {
          scrollStuckCount++;
          if (scrollStuckCount > 10) {
            container.scrollTo({
              top: 0,
              behavior: 'instant'
            });
            scrollStuckCount = 0;
          }
        } else {
          scrollStuckCount = 0;
        }

        lastScrollTop = container.scrollTop;
      }

      animationFrameId = requestAnimationFrame(scroll);
    };

    // Démarrer le défilement
    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="min-h-screen overflow-y-scroll bg-gradient-to-b from-gray-900 to-black"
      style={{ 
        height: '100vh',
        scrollBehavior: 'smooth'
      }}
    >
      <div className="p-6 space-y-6">
        {weekReservations.map((reservation, index) => {
          const bgColor = getActivityColor(reservation.activity.id);
          return (
            <div 
              key={index}
              className={`${bgColor} rounded-lg p-6 shadow-lg transform transition-all duration-200 hover:scale-[1.02] text-white`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-3xl font-bold mb-2">
                    {reservation.title || reservation.activity.name}
                  </div>
                  <div className="text-xl opacity-90">
                    {reservation.room.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold">
                    {format(reservation.startTime, 'EEEE', { locale: fr })}
                  </div>
                  <div className="text-xl">
                    {format(reservation.startTime, 'HH:mm')} - {format(reservation.endTime, 'HH:mm')}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Display;
