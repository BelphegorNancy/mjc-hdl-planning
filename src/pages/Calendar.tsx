import React, { useRef, useState, useCallback, useEffect } from 'react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  isWithinInterval,
  differenceInMinutes,
  setHours,
  setMinutes,
  parseISO,
  getISOWeek,
  subDays,
  getYear
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Grid, List, Filter, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import ReservationModal from '../components/ReservationModal';
import RoomFilters from '../components/RoomFilters';
import ActivityFilters from '../components/ActivityFilters';
import SearchFilters from '../components/SearchFilters';
import Panel from '../components/Panel';
import type { Reservation, Room } from '../types';
import CalendarGrid from '../components/CalendarGrid';
import CalendarListView from '../components/CalendarListView';
import Button from '../components/Button';
import html2canvas from 'html2canvas';
import PDFTest from '../components/PDFTest';
import PDFListView from '../components/PDFListView';
import CalendarMonthView from '../components/CalendarMonthView';
import PDFMonthView from '../components/PDFMonthView';

interface ViewMode {
  value: 'day' | '3days' | 'week' | 'month';
}

interface DisplayMode {
  value: 'grid' | 'list';
}

interface FilterType {
  rooms: string[];
  activities: string[];
  search: string;
}

const API_URL = '/api'; // URL relative pour utiliser la configuration nginx

const Calendar = () => {
  const { reservations: rawReservations, rooms: rawRooms, activities: rawActivities, currentUser, reloadData } = useStore();

  // Filtrer les réservations invalides dès le début
  const validReservations = rawReservations.filter(res => 
    res && 
    res.room && 
    res.room.id && 
    res.activity && 
    res.activity.id && 
    res.startTime && 
    res.endTime
  );

  // Convertir les dates en objets Date uniquement pour les réservations valides
  const reservations = React.useMemo(() => {
    return validReservations.map(reservation => ({
      ...reservation,
      startTime: new Date(reservation.startTime),
      endTime: new Date(reservation.endTime),
      createdAt: new Date(reservation.createdAt),
      room: reservation.room,
      activity: reservation.activity
    }));
  }, [validReservations]);

  // Ajouter des logs pour déboguer
  console.log('Raw data:', {
    rawReservations,
    rawRooms,
    rawActivities,
    currentUser
  });

  // Convertir les dates en objets Date
  const rooms = React.useMemo(() => {
    return rawRooms.map(room => ({
      ...room,
      createdAt: new Date(room.createdAt)
    }));
  }, [rawRooms]);

  const activities = React.useMemo(() => {
    return rawActivities.map(activity => ({
      ...activity,
      createdAt: activity.createdAt ? new Date(activity.createdAt) : undefined
    }));
  }, [rawActivities]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleRooms, setVisibleRooms] = useState<Set<string>>(new Set());
  const [visibleActivities, setVisibleActivities] = useState<Set<string>>(new Set());

  // Mettre à jour les salles et activités visibles quand les données changent
  useEffect(() => {
    setVisibleRooms(new Set(rooms.map(room => room.id)));
  }, [rooms]);

  useEffect(() => {
    setVisibleActivities(new Set(activities.map(activity => activity.id)));
  }, [activities]);

  // Recharger les données au montage
  useEffect(() => {
    if (!currentUser) return;
    reloadData();
  }, [currentUser]);

  // Attendre que les données soient chargées
  const isLoading = !rawRooms.length || !rawActivities.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>({ value: 'week' });
  const [displayMode, setDisplayMode] = useState<DisplayMode>({ value: 'grid' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<{ hours: number; minutes: number }>(() => {
    const now = new Date();
    const hours = now.getHours();
    return {
      hours: hours < 8 ? 8 : hours > 23 ? 8 : hours,
      minutes: 0
    };
  });
  const [selectedEndTime, setSelectedEndTime] = useState<{ hours: number; minutes: number }>(() => {
    const now = new Date();
    const hours = now.getHours() + 1;
    return {
      hours: hours < 8 ? 9 : hours > 23 ? 9 : hours,
      minutes: 0
    };
  });
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [filters, setFilters] = useState({
    date: '',
    roomId: '',
    activityId: '',
    searchTerm: '',
  });
  const [showPDFTest, setShowPDFTest] = useState(false);

  const handleShowPDF = () => {
    setShowPDFTest(true);
  };

  const roomsButtonRef = useRef<HTMLButtonElement>(null);
  const activitiesButtonRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const canEdit = currentUser !== null; // Permettre l'édition à tous les utilisateurs connectés

  // Filtrer les réservations invalides avant de les passer aux composants
  const filteredReservations = React.useMemo(() => {
    return reservations.filter(reservation => 
      reservation && 
      reservation.room && 
      reservation.activity && 
      reservation.room.id && 
      reservation.activity.id
    );
  }, [reservations]);

  // Filtrer les réservations en fonction des salles et activités visibles
  const filteredReservationsVisible = React.useMemo(() => {
    console.log('Filtering reservations:', {
      allReservations: reservations,
      visibleRooms,
      visibleActivities,
      filters
    });
    
    return filteredReservations.filter(reservation => {
      // Vérification de sécurité pour room et activity
      if (!reservation || !reservation.room || !reservation.activity) {
        console.error('Invalid reservation found:', reservation);
        return false;
      }

      const roomId = reservation.room?.id;
      const activityId = reservation.activity?.id;

      if (!roomId || !activityId) {
        console.error('Missing room or activity ID:', { roomId, activityId, reservation });
        return false;
      }

      const matchesRoom = visibleRooms.has(roomId);
      const matchesActivity = visibleActivities.has(activityId);
      const matchesDate = !filters.date || format(reservation.startTime, 'yyyy-MM-dd') === filters.date;
      const matchesRoomFilter = !filters.roomId || roomId === filters.roomId;
      const matchesActivityFilter = !filters.activityId || activityId === filters.activityId;
      const matchesSearch = !filters.searchTerm || 
        (reservation.title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) || false) ||
        (reservation.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) || false) ||
        reservation.activity.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        reservation.room.name.toLowerCase().includes(filters.searchTerm.toLowerCase());

      return matchesRoom && matchesActivity && matchesDate && matchesRoomFilter && matchesActivityFilter && matchesSearch;
    });
  }, [reservations, visibleRooms, visibleActivities, filters]);

  console.log('Current user:', currentUser);
  console.log('Can edit:', canEdit);
  console.log('Calendar - Current reservations:', reservations);
  console.log('Calendar - Filtered reservations:', filteredReservationsVisible);
  console.log('Calendar - Visible rooms:', visibleRooms);
  console.log('Calendar - Visible activities:', visibleActivities);

  const days = React.useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // 1 = Lundi
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const displayDays = React.useMemo(() => {
    switch (viewMode.value) {
      case 'day':
        return [selectedDate];
      case '3days': {
        let startDate = selectedDate;
        const dayOfWeek = format(selectedDate, 'i', { locale: fr });
        
        // Ajuster la date de début si on est sur un weekend
        if (dayOfWeek === '7') { // Dimanche
          startDate = subDays(selectedDate, 2);
        } else if (dayOfWeek === '6') { // Samedi
          startDate = subDays(selectedDate, 1);
        }
        
        return eachDayOfInterval({
          start: startDate,
          end: addDays(startDate, 2)
        });
      }
      case 'week':
      default:
        return eachDayOfInterval({
          start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
          end: endOfWeek(selectedDate, { weekStartsOn: 1 })
        });
    }
  }, [selectedDate, viewMode]);

  const weekNumber = React.useMemo(() => {
    return getISOWeek(selectedDate);
  }, [selectedDate]);

  const weekYear = React.useMemo(() => {
    return getYear(selectedDate);
  }, [selectedDate]);

  const weekPeriod = React.useMemo(() => {
    const monday = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const sunday = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return `${format(monday, 'EEEE dd/MM/yyyy', { locale: fr })} au ${format(sunday, 'EEEE dd/MM/yyyy', { locale: fr })}`;
  }, [selectedDate]);

  const handlePrevious = () => {
    if (viewMode.value === 'week') {
      setSelectedDate(addWeeks(selectedDate, -1));
    } else {
      setSelectedDate(addDays(selectedDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode.value === 'week') {
      setSelectedDate(addWeeks(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  const handleToggleAll = (show: boolean) => {
    setVisibleRooms(new Set(show ? rooms.map(room => room.id) : []));
  };

  const handleNewReservation = (date: Date, hour: number, minutes: number, room: Room) => {
    if (!currentUser) {
      alert('Vous devez être connecté pour faire une réservation');
      return;
    }

    if (!canEdit) {
      alert('Vous n\'avez pas les droits nécessaires pour faire une réservation');
      return;
    }

    setEditingReservation(null);
    
    // Créer une nouvelle date avec l'heure sélectionnée
    const startTime = new Date(date);
    startTime.setHours(hour, minutes, 0, 0);
    
    // L'heure de fin est par défaut 1h après
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);
    
    setSelectedDate(startTime);
    setSelectedTime({
      hours: startTime.getHours(),
      minutes: startTime.getMinutes()
    });
    setSelectedEndTime({
      hours: endTime.getHours(),
      minutes: endTime.getMinutes()
    });
    setSelectedRoom(room.id);
    setIsModalOpen(true);
  };

  const handleCellClick = useCallback((date: Date, hour: number, minutes: number, room: Room) => {
    console.log('handleCellClick called with:', { date, hour, minutes, room });
    
    if (!currentUser) {
      alert('Vous devez être connecté pour faire une réservation');
      return;
    }

    if (!canEdit) {
      alert('Vous n\'avez pas les droits nécessaires pour faire une réservation');
      return;
    }

    setEditingReservation(null);
    
    // Créer une nouvelle date avec l'heure sélectionnée
    const startTime = new Date(date);
    startTime.setHours(hour, minutes, 0, 0);
    
    setSelectedDate(startTime);
    setSelectedTime({
      hours: startTime.getHours(),
      minutes: startTime.getMinutes()
    });
    
    // Gérer le cas où l'heure de fin est après minuit
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);
    
    setSelectedEndTime({
      hours: endTime.getHours(),
      minutes: endTime.getMinutes()
    });
    
    setSelectedRoom(room.id);
    setIsModalOpen(true);
  }, [currentUser, canEdit]);

  const handleReservationClick = useCallback((reservation: Reservation) => {
    if (!currentUser) {
      alert('Vous devez être connecté pour modifier une réservation');
      return;
    }

    if (!canEdit) {
      alert('Vous n\'avez pas les droits nécessaires pour modifier une réservation');
      return;
    }

    setEditingReservation(reservation);
    setIsModalOpen(true);
  }, [currentUser, canEdit]);

  const handleReservationDrop = async (reservation: Reservation, newStartTime: Date) => {
    try {
      console.log('handleReservationDrop - Initial times:', {
        originalStart: format(reservation.startTime, 'dd/MM/yyyy HH:mm'),
        newStart: format(newStartTime, 'dd/MM/yyyy HH:mm')
      });

      // Calculer la nouvelle heure de fin en conservant la même durée
      const duration = new Date(reservation.endTime).getTime() - new Date(reservation.startTime).getTime();
      const adjustedEndTime = new Date(newStartTime.getTime() + duration);

      console.log('handleReservationDrop - Adjusted times:', {
        newStart: format(newStartTime, 'dd/MM/yyyy HH:mm'),
        newEnd: format(adjustedEndTime, 'dd/MM/yyyy HH:mm'),
        duration: duration / (1000 * 60) + ' minutes'
      });

      // Vérifier les chevauchements
      const overlappingReservations = reservations.filter(r => {
        // Ne pas comparer avec la réservation elle-même
        if (r.id === reservation.id) return false;
        
        // Vérifier uniquement les réservations de la même salle
        if (r.room.id !== reservation.room.id) return false;
        
        // Vérifier uniquement les réservations du même jour
        if (!isSameDay(r.startTime, newStartTime)) return false;

        const rStart = new Date(r.startTime);
        const rEnd = new Date(r.endTime);

        // Vérifier si la nouvelle plage horaire chevauche une réservation existante
        const hasOverlap = (
          (newStartTime < rEnd && adjustedEndTime > rStart)
        );

        if (hasOverlap) {
          console.log('Possible overlap found with reservation:', {
            overlappingId: r.id,
            overlappingStart: format(rStart, 'HH:mm'),
            overlappingEnd: format(rEnd, 'HH:mm'),
            newStart: format(newStartTime, 'HH:mm'),
            newEnd: format(adjustedEndTime, 'HH:mm')
          });

          // Vérifier si c'est un vrai chevauchement ou juste une réservation adjacente
          const isAdjacent = (
            Math.abs(newStartTime.getTime() - rEnd.getTime()) < 1000 || // Moins d'une seconde de différence
            Math.abs(adjustedEndTime.getTime() - rStart.getTime()) < 1000
          );

          return !isAdjacent;
        }

        return false;
      });

      if (overlappingReservations.length > 0) {
        setError("Il y a déjà une réservation sur ce créneau");
        return;
      }

      console.log('handleReservationDrop - Updating reservation:', {
        id: reservation.id,
        newStart: format(newStartTime, 'dd/MM/yyyy HH:mm'),
        newEnd: format(adjustedEndTime, 'dd/MM/yyyy HH:mm')
      });

      await fetch(`${API_URL}/reservations/${reservation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          startTime: newStartTime.toISOString(),
          endTime: adjustedEndTime.toISOString()
        }),
      });

      console.log('Reservation updated successfully');
    } catch (error) {
      console.error('Erreur lors du déplacement de la réservation:', error);
      setError("Une erreur est survenue lors du déplacement de la réservation");
    }
  };

  const handleRoomToggle = (roomId: string) => {
    const newVisibleRooms = new Set(visibleRooms);
    if (newVisibleRooms.has(roomId)) {
      newVisibleRooms.delete(roomId);
    } else {
      newVisibleRooms.add(roomId);
    }
    setVisibleRooms(newVisibleRooms);
  };

  const handleActivityToggle = (activityId: string) => {
    const newVisibleActivities = new Set(visibleActivities);
    if (newVisibleActivities.has(activityId)) {
      newVisibleActivities.delete(activityId);
    } else {
      newVisibleActivities.add(activityId);
    }
    setVisibleActivities(newVisibleActivities);
  };

  const handlePrint = () => {
    const element = displayMode.value === 'grid' 
      ? document.querySelector('.calendar-grid-container')
      : document.querySelector('.calendar-list-container');
    if (element) {
      // Sauvegarder l'état actuel des salles visibles
      const originalVisibleRooms = new Set(visibleRooms);
      
      // Rendre toutes les salles visibles pour l'export
      setVisibleRooms(new Set(rooms.map(room => room.id)));
      
      // Attendre que le DOM soit mis à jour
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(element as HTMLElement, {
            scale: 2,
            useCORS: true,
            logging: true,
            width: element.scrollWidth,
            height: element.scrollHeight,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('l', 'mm', 'a3');
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 20) / imgHeight);
          
          const imgX = 10 + (pdfWidth - 20 - imgWidth * ratio) / 2;
          const imgY = 10;

          pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
          pdf.save('planning.pdf');

          // Restaurer les salles visibles après l'export
          setVisibleRooms(originalVisibleRooms);
        } catch (error) {
          console.error('Erreur lors de l\'export PDF:', error);
          // Restaurer les salles visibles en cas d'erreur
          setVisibleRooms(originalVisibleRooms);
        }
      }, 100);
    }
  };

  const handleAddReservation = async (reservation: Omit<Reservation, 'id'>) => {
    try {
      if (!currentUser?.token) {
        throw new Error('Non authentifié');
      }

      console.log('Adding reservation:', {
        ...reservation,
        startTime: format(reservation.startTime, 'dd/MM/yyyy HH:mm'),
        endTime: format(reservation.endTime, 'dd/MM/yyyy HH:mm'),
        startTimeISO: reservation.startTime.toISOString(),
        endTimeISO: reservation.endTime.toISOString(),
        roomId: reservation.roomId,
        activityId: reservation.activityId
      });

      const response = await fetch(`${API_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          ...reservation,
          startTime: reservation.startTime.toISOString(),
          endTime: reservation.endTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        console.error('Server error:', errorData);
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Reservation added successfully:', data);

      await reloadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding reservation:', error);
      setError(error instanceof Error ? error.message : "Une erreur est survenue lors de l'ajout de la réservation");
    }
  };

  const handleUpdateReservation = async (id: string, reservation: Partial<Reservation>) => {
    try {
      const response = await fetch(`${API_URL}/reservations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`,
        },
        body: JSON.stringify(reservation),
      });

      if (!response.ok) {
        throw new Error('Failed to update reservation');
      }

      await reloadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating reservation:', error);
      setError("Une erreur est survenue lors de la mise à jour de la réservation");
    }
  };

  const handleDeleteReservation = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/reservations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete reservation');
      }

      await reloadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error deleting reservation:', error);
      setError("Une erreur est survenue lors de la suppression de la réservation");
    }
  };

  return (
    <div className="h-full">
      <div className="flex flex-col space-y-4 mb-4">
        {/* Contrôles de navigation et filtres */}
        <div className="space-y-4 print:hidden">
          {/* Première ligne : navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="p-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={handleNext}
                  className="p-2"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <div className="flex flex-col">
                  {viewMode.value === 'week' ? (
                    <span className="text-sm font-medium text-gray-700">
                      Semaine {weekNumber} - {weekYear}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-gray-700">
                      {format(selectedDate, 'EEEE dd/MM/yyyy', { locale: fr })}
                    </span>
                  )}
                  {viewMode.value === 'week' && (
                    <span className="text-sm text-gray-600">
                      {weekPeriod}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode.value === 'day' ? 'primary' : 'outline'}
                  onClick={() => setViewMode({ value: 'day' })}
                  className="px-3 py-1"
                >
                  Jour
                </Button>
                <Button
                  variant={viewMode.value === '3days' ? 'primary' : 'outline'}
                  onClick={() => setViewMode({ value: '3days' })}
                  className="px-3 py-1"
                >
                  3 jours
                </Button>
                <Button
                  variant={viewMode.value === 'week' ? 'primary' : 'outline'}
                  onClick={() => setViewMode({ value: 'week' })}
                  className="px-3 py-1"
                >
                  Semaine
                </Button>
                <Button
                  variant={viewMode.value === 'month' ? 'primary' : 'outline'}
                  onClick={() => setViewMode({ value: 'month' })}
                  className="px-3 py-1"
                >
                  Mois
                </Button>
              </div>

              <button
                onClick={() => setDisplayMode(displayMode.value === 'grid' ? { value: 'list' } : { value: 'grid' })}
                className="p-2 hover:bg-gray-100 rounded-full"
                title={displayMode.value === 'grid' ? 'Vue liste' : 'Vue grille'}
              >
                {displayMode.value === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
              </button>

              {canEdit && (
                <Button onClick={() => handleNewReservation(currentDate, 8, 0, rooms[0])}>
                  <Plus className="h-5 w-5 mr-1" />
                  Nouvelle réservation
                </Button>
              )}

              <Button
                variant="primary"
                onClick={() => setShowPDFTest(true)}
                className="flex items-center gap-2"
              >
                Export PDF
              </Button>

              {/* Modal pour le test PDF */}
              {showPDFTest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-4 w-full h-full max-w-7xl max-h-[90vh]">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Aperçu PDF</h2>
                      <button
                        onClick={() => setShowPDFTest(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="h-[calc(100%-4rem)]">
                      {viewMode.value === 'month' ? (
                        <PDFMonthView
                          selectedDate={selectedDate}
                          reservations={filteredReservationsVisible}
                          rooms={rooms}
                          activities={activities}
                        />
                      ) : (
                        <PDFTest
                          selectedDate={selectedDate}
                          reservations={filteredReservationsVisible}
                          rooms={rooms}
                          activities={activities}
                          viewMode={viewMode.value === 'week' ? 'week' : 'day'}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deuxième ligne : filtres */}
          <div className="flex items-center justify-center space-x-4">
            <div>
            </div>
          </div>

          {/* Panneau de recherche */}
          <div className="print:hidden flex justify-center">
            <div className="w-full max-w-3xl">
              <SearchFilters
                rooms={rooms}
                activities={activities}
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>
          </div>

          <div className="pt-16 h-full">
            <div ref={calendarRef} className="h-full bg-white" data-calendar-container>
              {viewMode.value === 'month' ? (
                <CalendarMonthView 
                  selectedDate={selectedDate} 
                  reservations={filteredReservationsVisible}
                  onReservationClick={handleReservationClick}
                  onDayClick={(date) => {
                    setSelectedDate(date);
                    setViewMode({ value: 'week' });
                  }}
                  rooms={rooms}
                />
              ) : displayMode.value === 'grid' ? (
                <CalendarGrid
                  days={displayDays}
                  rooms={rooms.filter(room => visibleRooms.has(room.id))}
                  reservations={filteredReservationsVisible}
                  onCellClick={handleCellClick}
                  onReservationClick={handleReservationClick}
                  onReservationDrop={handleReservationDrop}
                />
              ) : (
                <CalendarListView
                  days={displayDays}
                  rooms={rooms}
                  reservations={filteredReservationsVisible}
                  onReservationClick={handleReservationClick}
                />
              )}
            </div>
          </div>

          <ReservationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedEndTime={selectedEndTime}
            editingReservation={editingReservation}
            selectedRoom={selectedRoom}
            onAddReservation={handleAddReservation}
            onUpdateReservation={handleUpdateReservation}
            onDeleteReservation={handleDeleteReservation}
          />
        </div>
      </div>
    </div>
  );
};

export default Calendar;