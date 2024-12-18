import React from 'react';
import { format, addDays, startOfWeek, isSameDay, addWeeks, addMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, ChevronLeft, ChevronRight, TrashIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Reservation, RecurrenceType, RecurrenceInfo } from '../types';
import Button from './Button';
import { v4 } from 'uuid';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedTime: { hours: number; minutes: number };
  selectedEndTime: { hours: number; minutes: number };
  editingReservation: Reservation | null;
  selectedRoom?: string;
  onAddReservation: (reservation: Omit<Reservation, 'id'>) => Promise<void>;
  onUpdateReservation: (id: string, reservation: Partial<Reservation>) => Promise<void>;
  onDeleteReservation: (id: string) => Promise<void>;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  selectedEndTime,
  editingReservation,
  selectedRoom: initialSelectedRoom,
  onAddReservation,
  onUpdateReservation,
  onDeleteReservation,
}) => {
  const { 
    currentUser,
    rooms,
    activities,
    reservations,
  } = useStore();

  const [selectedRoom, setSelectedRoom] = React.useState<string>('');
  const [selectedActivity, setSelectedActivity] = React.useState<string>('');
  const [title, setTitle] = React.useState('');
  const [currentDate, setCurrentDate] = React.useState(selectedDate);
  const [selectedDates, setSelectedDates] = React.useState<Date[]>([selectedDate]);
  const [error, setError] = React.useState<string>('');
  const [notes, setNotes] = React.useState('');
  const [recurrenceType, setRecurrenceType] = React.useState<RecurrenceType>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = React.useState<Date | undefined>(undefined);
  const [recurrenceInterval, setRecurrenceInterval] = React.useState<number>(1);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = React.useState<number[]>([]);
  const [showUpdateOptions, setShowUpdateOptions] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [startTime, setStartTime] = React.useState<{ hours: number; minutes: number }>({ 
    hours: selectedTime?.hours || 8, 
    minutes: selectedTime?.minutes || 0 
  });
  const [endTime, setEndTime] = React.useState<{ hours: number; minutes: number }>({ 
    hours: selectedEndTime?.hours || 9, 
    minutes: selectedEndTime?.minutes || 0 
  });
  const [updateOption, setUpdateOption] = React.useState<'single' | 'all'>('single');

  const canEdit = currentUser !== null;

  React.useEffect(() => {
    console.log('ReservationModal useEffect:', {
      isOpen,
      editingReservation,
      selectedTime,
      selectedEndTime,
      selectedDate,
      initialSelectedRoom,
      startTime,
      endTime
    });

    if (isOpen) {
      if (editingReservation) {
        setSelectedRoom(editingReservation.room.id);
        setSelectedActivity(editingReservation.activity.id);
        setTitle(editingReservation.title || '');
        const startDate = typeof editingReservation.startTime === 'string' 
          ? parseISO(editingReservation.startTime) 
          : editingReservation.startTime;
        setCurrentDate(startDate);
        setSelectedDates([startDate]);
        setNotes(editingReservation.notes || '');
        setStartTime({
          hours: startDate.getHours(),
          minutes: startDate.getMinutes()
        });
        const endDate = typeof editingReservation.endTime === 'string'
          ? parseISO(editingReservation.endTime)
          : editingReservation.endTime;
        setEndTime({
          hours: endDate.getHours(),
          minutes: endDate.getMinutes()
        });
      } else {
        setSelectedRoom(initialSelectedRoom || '');
        setSelectedActivity('');
        setTitle('');
        setCurrentDate(selectedDate);
        setSelectedDates([selectedDate]);
        setNotes('');
        setStartTime({ 
          hours: selectedTime?.hours || 8,
          minutes: selectedTime?.minutes || 0 
        });
        setEndTime({ 
          hours: selectedEndTime?.hours || 9,
          minutes: selectedEndTime?.minutes || 0 
        });
      }
      setError('');
    }
  }, [isOpen, editingReservation, selectedTime, selectedEndTime, selectedDate, initialSelectedRoom]);

  // Créneaux horaires disponibles (8h-minuit)
  const timeSlots = React.useMemo(() => {
    const slots = [];
    // De 8h à 23h
    for (let hour = 8; hour <= 23; hour++) {
      slots.push({ hours: hour, minutes: 0 });
      slots.push({ hours: hour, minutes: 30 });
    }
    // Ajouter minuit (0h)
    slots.push({ hours: 0, minutes: 0 });
    return slots;
  }, []);

  // Pour l'heure de fin, on propose les créneaux après l'heure de début
  const endTimeSlots = React.useMemo(() => {
    if (!startTime) return timeSlots;

    const startHour = startTime.hours;
    const startMinutes = startTime.minutes;

    return timeSlots.filter(slot => {
      // Si l'heure de début est minuit, pas de créneaux de fin disponibles
      if (startHour === 0) return false;

      // Si le créneau est minuit, il est toujours disponible après l'heure de début
      if (slot.hours === 0) return true;

      // Sinon, le créneau doit être après l'heure de début
      return (
        slot.hours > startHour || 
        (slot.hours === startHour && slot.minutes > startMinutes)
      );
    });
  }, [startTime, timeSlots]);

  const weekDays = React.useMemo(() => 
    Array.from({ length: 7 }, (_, i) => 
      addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i)
    ), [currentDate]
  );

  const handleDateClick = (date: Date) => {
    const newDate = new Date(date);
    // Réinitialiser l'heure à minuit pour éviter les problèmes de timezone
    newDate.setHours(0, 0, 0, 0);
    
    // Si on modifie une réservation existante, on ne permet qu'une seule date
    if (editingReservation) {
      setSelectedDates([newDate]);
      setCurrentDate(newDate);
      setError('');
      return;
    }

    // Pour une nouvelle réservation, on gère la sélection multiple
    setSelectedDates(prevDates => {
      const dateExists = prevDates.some(d => isSameDay(d, newDate));
      if (dateExists) {
        // Si la date est déjà sélectionnée, on la retire
        return prevDates.filter(d => !isSameDay(d, newDate));
      } else {
        // Sinon on l'ajoute
        return [...prevDates, newDate];
      }
    });
    setCurrentDate(newDate);
    setError('');
  };

  const checkOverlap = (start: Date, end: Date, roomId: string, excludeReservationId?: string) => {
    console.log('Checking overlap for:', {
      start: format(start, 'dd/MM/yyyy HH:mm'),
      end: format(end, 'dd/MM/yyyy HH:mm'),
      roomId,
      excludeReservationId,
      allReservations: reservations
    });

    const overlappingReservations = reservations.filter(reservation => {
      // Ignorer la réservation en cours de modification
      if (excludeReservationId && reservation.id === excludeReservationId) {
        console.log('Ignoring reservation being edited:', reservation);
        return false;
      }
      
      // Vérifier si c'est la même salle
      if (reservation.room.id !== roomId) {
        console.log('Different room, no overlap:', reservation);
        return false;
      }

      // Vérifier si c'est le même jour
      if (!isSameDay(start, reservation.startTime)) {
        console.log('Different day, no overlap:', reservation);
        return false;
      }

      const resStart = new Date(reservation.startTime);
      const resEnd = new Date(reservation.endTime);
      
      // Ajuster la date de fin si elle est à minuit le jour suivant
      if (resEnd.getHours() === 0 && resEnd.getMinutes() === 0) {
        resEnd.setHours(24, 0);
      }

      // Vérifier le chevauchement
      const hasOverlap = (
        (start < resEnd && end > resStart) || // Chevauchement normal
        (start.getTime() === resStart.getTime()) // Même heure de début
      );

      console.log('Checking overlap with reservation:', {
        reservation,
        hasOverlap,
        resStart: format(resStart, 'dd/MM/yyyy HH:mm'),
        resEnd: format(resEnd, 'dd/MM/yyyy HH:mm')
      });

      return hasOverlap;
    });

    console.log('Found overlapping reservations:', overlappingReservations);
    return overlappingReservations.length > 0;
  };

  const generateRecurringDates = (
    startDate: Date,
    endDate: Date,
    type: RecurrenceType,
    interval: number = 1,
    daysOfWeek: number[] = []
  ): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      switch (type) {
        case 'daily':
          dates.push(new Date(currentDate));
          currentDate = addDays(currentDate, interval);
          break;
        case 'weekly':
          if (daysOfWeek.length > 0) {
            daysOfWeek.forEach(day => {
              const dayDate = addDays(startOfWeek(currentDate), day);
              if (dayDate >= startDate && dayDate <= endDate) {
                dates.push(new Date(dayDate));
              }
            });
            currentDate = addWeeks(currentDate, interval);
          }
          break;
        case 'monthly':
          dates.push(new Date(currentDate));
          currentDate = addMonths(currentDate, interval);
          break;
        default:
          dates.push(new Date(currentDate));
          currentDate = addDays(currentDate, 1);
      }
    }

    return dates;
  };

  const isPartOfSeries = React.useMemo(() => {
    if (!editingReservation) return false;
    
    // Vérifier si c'est une réservation avec récurrence
    if (editingReservation.recurrence) return true;
    
    // Vérifier si c'est une instance d'une série
    if (editingReservation.parentReservationId) return true;
    
    // Vérifier si c'est un parent avec des instances
    const hasChildren = reservations.some(r => r.parentReservationId === editingReservation.id);
    if (hasChildren) return true;
    
    // Vérifier si d'autres réservations partagent le même parent
    const parent = reservations.find(r => r.id === editingReservation.parentReservationId);
    if (parent) {
      const hasSiblings = reservations.some(r => 
        r.id !== editingReservation.id && 
        r.parentReservationId === parent.id
      );
      if (hasSiblings) return true;
    }
    
    return false;
  }, [editingReservation, reservations]);

  const handleDelete = () => {
    if (!editingReservation) return;
    
    console.log('Handling delete for reservation:', {
      id: editingReservation.id,
      parentId: editingReservation.parentReservationId,
      isPartOfSeries,
      hasRecurrence: !!editingReservation.recurrence
    });
    
    // Si c'est une réservation récurrente ou fait partie d'une série, montrer les options de suppression
    if (isPartOfSeries) {
      setShowDeleteConfirm(true);
    } else {
      // Si c'est une réservation unique, supprimer directement
      onDeleteReservation(editingReservation.id);
      onClose();
    }
  };

  const handleDeleteConfirm = (deleteAll: boolean) => {
    if (!editingReservation) return;
    
    console.log('Confirming delete:', {
      deleteAll,
      reservationId: editingReservation.id,
      parentId: editingReservation.parentReservationId
    });
    
    if (deleteAll) {
      // Si on veut supprimer toute la série
      if (editingReservation.parentReservationId) {
        // Si c'est une instance d'une série, utiliser l'ID parent
        onDeleteReservation(editingReservation.parentReservationId);
      } else {
        // Si c'est la réservation parent, utiliser son propre ID
        onDeleteReservation(editingReservation.id);
      }
    } else {
      // Supprimer uniquement cette instance
      onDeleteReservation(editingReservation.id);
    }
    
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleUpdateOptionChange = (option: 'single' | 'all') => {
    setUpdateOption(option);
    setShowUpdateOptions(false);

    // Appliquer les modifications selon l'option choisie
    if (!editingReservation) return;

    // S'assurer que nous avons une date valide
    if (!selectedDates[0]) {
      setError('Date invalide');
      return;
    }

    // Créer de nouvelles instances de Date pour éviter les problèmes de référence
    const startDateTime = new Date(selectedDates[0].getTime());
    startDateTime.setHours(startTime.hours, startTime.minutes, 0, 0);

    const endDateTime = new Date(selectedDates[0].getTime());
    endDateTime.setHours(endTime.hours, endTime.minutes, 0, 0);
    
    // Si l'heure de fin est avant l'heure de début, ajouter un jour
    if (endTime.hours < startTime.hours || (endTime.hours === startTime.hours && endTime.minutes <= startTime.minutes)) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    // Vérifier s'il y a des chevauchements avec d'autres réservations
    if (checkOverlap(startDateTime, endDateTime, selectedRoom, editingReservation.id)) {
      setError('Une réservation existe déjà pour cette salle sur ce créneau horaire');
      return;
    }

    const selectedRoomObj = rooms.find(r => r.id === selectedRoom);
    const selectedActivityObj = activities.find(a => a.id === selectedActivity);

    if (!selectedRoomObj || !selectedActivityObj) {
      setError('Salle ou activité non trouvée');
      return;
    }

    const updates = {
      room: selectedRoomObj,
      roomId: selectedRoom,
      activity: selectedActivityObj,
      activityId: selectedActivity,
      startTime: startDateTime,
      endTime: endDateTime,
      title: title || undefined,
      notes: notes.trim() || undefined,
    };

    console.log('Updating reservation with:', {
      option,
      updates,
      startDateTime: format(startDateTime, 'dd/MM/yyyy HH:mm'),
      endDateTime: format(endDateTime, 'dd/MM/yyyy HH:mm')
    });

    if (option === 'all') {
      // Mettre à jour toute la série
      if (editingReservation.parentReservationId) {
        onUpdateReservation(editingReservation.parentReservationId, updates);
      } else {
        onUpdateReservation(editingReservation.id, updates);
      }
    } else {
      // Mettre à jour uniquement cette instance
      onUpdateReservation(editingReservation.id, updates);
    }

    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called with:', {
      selectedDates,
      startTime,
      endTime,
      selectedRoom,
      selectedActivity,
      isPartOfSeries,
      showUpdateOptions,
      currentUser
    });

    setError('');

    if (!canEdit) {
      setError('Vous n\'avez pas les droits nécessaires pour effectuer cette action');
      return;
    }

    if (!selectedRoom || !selectedActivity) {
      setError('Veuillez sélectionner une salle et une activité');
      return;
    }

    if (selectedDates.length === 0) {
      setError('Veuillez sélectionner au moins une date');
      return;
    }

    try {
      if (editingReservation) {
        // Si c'est une réservation récurrente et qu'on n'a pas encore choisi l'option de mise à jour
        if (isPartOfSeries && !showUpdateOptions) {
          setShowUpdateOptions(true);
          return;
        }

        // Créer de nouvelles instances de Date pour la mise à jour
        const startDateTime = new Date(currentDate);
        startDateTime.setHours(startTime.hours, startTime.minutes, 0, 0);

        const endDateTime = new Date(currentDate);
        endDateTime.setHours(endTime.hours, endTime.minutes, 0, 0);

        // Si l'heure de fin est avant l'heure de début, ajouter un jour
        if (endTime.hours < startTime.hours || (endTime.hours === startTime.hours && endTime.minutes <= startTime.minutes)) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }

        // Vérifier les chevauchements
        if (checkOverlap(startDateTime, endDateTime, selectedRoom, editingReservation.id)) {
          setError('Une réservation existe déjà pour cette salle sur ce créneau horaire');
          return;
        }

        const selectedRoomObj = rooms.find(r => r.id === selectedRoom);
        const selectedActivityObj = activities.find(a => a.id === selectedActivity);

        if (!selectedRoomObj || !selectedActivityObj) {
          setError('Salle ou activité non trouvée');
          return;
        }

        const updates = {
          room: selectedRoomObj,
          roomId: selectedRoom,
          activity: selectedActivityObj,
          activityId: selectedActivity,
          startTime: startDateTime,
          endTime: endDateTime,
          title: title || undefined,
          notes: notes.trim() || undefined,
        };

        console.log('Updating single reservation:', {
          id: editingReservation.id,
          updates,
          startDateTime: format(startDateTime, 'dd/MM/yyyy HH:mm'),
          endDateTime: format(endDateTime, 'dd/MM/yyyy HH:mm')
        });

        // Mettre à jour la réservation
        onUpdateReservation(editingReservation.id, updates);
        onClose();
        return;
      }

      let datesToCreate: Date[] = selectedDates;
      
      // Si la récurrence est activée, générer toutes les dates
      if (recurrenceType !== 'none' && recurrenceEndDate) {
        datesToCreate = generateRecurringDates(
          selectedDates[0],
          recurrenceEndDate,
          recurrenceType,
          recurrenceInterval,
          selectedDaysOfWeek
        );
      }

      // Vérifier les chevauchements pour toutes les dates
      for (const date of datesToCreate) {
        const reservationStartTime = new Date(date);
        reservationStartTime.setHours(startTime.hours, startTime.minutes, 0, 0);

        const reservationEndTime = new Date(date);
        reservationEndTime.setHours(endTime.hours, endTime.minutes, 0, 0);

        // Ajuster la date de fin si elle est avant la date de début
        if (endTime.hours < startTime.hours || (endTime.hours === startTime.hours && endTime.minutes <= startTime.minutes)) {
          reservationEndTime.setDate(reservationEndTime.getDate() + 1);
        }

        console.log('Checking overlap for date:', {
          date: format(date, 'dd/MM/yyyy'),
          startTime: format(reservationStartTime, 'dd/MM/yyyy HH:mm'),
          endTime: format(reservationEndTime, 'dd/MM/yyyy HH:mm'),
          room: selectedRoom
        });

        if (checkOverlap(reservationStartTime, reservationEndTime, selectedRoom)) {
          setError(`Une réservation existe déjà pour cette salle le ${format(date, 'dd/MM/yyyy')} sur ce créneau horaire`);
          return;
        }
      }

      // Créer les réservations
      const parentId = v4();
      const promises = datesToCreate.map((date, index) => {
        const reservationStartTime = new Date(date);
        reservationStartTime.setHours(startTime.hours, startTime.minutes, 0, 0);

        const reservationEndTime = new Date(date);
        reservationEndTime.setHours(endTime.hours, endTime.minutes, 0, 0);

        // Ajuster la date de fin si elle est avant la date de début
        if (endTime.hours < startTime.hours || (endTime.hours === startTime.hours && endTime.minutes <= startTime.minutes)) {
          reservationEndTime.setDate(reservationEndTime.getDate() + 1);
        }

        const selectedRoomObj = rooms.find(r => r.id === selectedRoom);
        const selectedActivityObj = activities.find(a => a.id === selectedActivity);

        if (!selectedRoomObj || !selectedActivityObj) {
          throw new Error('Salle ou activité non trouvée');
        }

        const newReservation = {
          id: index === 0 ? parentId : v4(),
          title: title || undefined,
          roomId: selectedRoom,
          room: selectedRoomObj,
          activityId: selectedActivity,
          activity: selectedActivityObj,
          startTime: new Date(reservationStartTime),
          endTime: new Date(reservationEndTime),
          createdBy: currentUser?.id || 'unknown',
          createdAt: new Date(),
          notes: notes.trim() || undefined,
          parentReservationId: index === 0 ? undefined : parentId,
          recurrence: recurrenceType !== 'none' ? {
            type: recurrenceType,
            endDate: recurrenceEndDate,
            interval: recurrenceInterval,
            daysOfWeek: selectedDaysOfWeek
          } : undefined
        };

        console.log('Creating reservation:', {
          ...newReservation,
          startTime: format(newReservation.startTime, 'dd/MM/yyyy HH:mm'),
          endTime: format(newReservation.endTime, 'dd/MM/yyyy HH:mm'),
          room: newReservation.room.name,
          activity: newReservation.activity.name
        });

        return onAddReservation(newReservation);
      });

      await Promise.all(promises);
      onClose();
    } catch (err) {
      console.error('Erreur lors de la création de la réservation:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la création de la réservation');
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [hoursStr, minutesStr] = e.target.value.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    console.log('Start time changed:', { hours, minutes });
    
    const startValue = hours * 60 + minutes;
    const endValue = endTime.hours * 60 + endTime.minutes;
    
    setStartTime({ hours, minutes });
    
    // Si l'heure de fin est avant ou égale à l'heure de début
    if (endValue <= startValue) {
      const newEndTime = {
        hours: minutes === 30 ? (hours === 23 ? 0 : hours + 1) : hours,
        minutes: minutes === 30 ? 0 : 30
      };
      setEndTime(newEndTime);
    }
    setError('');
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [hoursStr, minutesStr] = e.target.value.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    console.log('End time changed:', { hours, minutes });
    setEndTime({ hours, minutes });
    setError('');
  };

  const formatTimeSlot = (slot: { hours?: number; minutes?: number } | null) => {
    if (!slot || typeof slot.hours === 'undefined' || typeof slot.minutes === 'undefined') {
      return '08:00';
    }
    return `${slot.hours.toString().padStart(2, '0')}:${slot.minutes.toString().padStart(2, '0')}`;
  };

  const isRecurring = editingReservation && editingReservation.recurrence;

  if (!isOpen) return null;

  return (
    // ... (le reste du code reste inchangé)