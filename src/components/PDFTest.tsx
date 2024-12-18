import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Reservation, Room, Activity } from '../types';

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#112233',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 10,
    textAlign: 'center',
    color: '#4B5563',
  },
  gridContainer: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: '5%',
    borderRightWidth: 1,
    borderRightColor: '#EAEAEA',
    borderRightStyle: 'solid',
    backgroundColor: '#F9FAFB',
  },
  timeSlot: {
    height: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    borderBottomStyle: 'solid',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 8,
    color: '#6B7280',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  dayColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#EAEAEA',
    borderRightStyle: 'solid',
  },
  dayHeader: {
    height: 30,
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    borderBottomStyle: 'solid',
  },
  dayTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  dayDate: {
    fontSize: 8,
    color: '#6B7280',
  },
  dayContent: {
    position: 'relative',
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#EAEAEA',
    borderRightStyle: 'solid',
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    borderBottomStyle: 'solid',
    height: 1,
  },
  reservation: {
    position: 'absolute',
    backgroundColor: '#EBF5FF',
    borderRadius: 4,
    padding: 4,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    fontSize: 8,
    overflow: 'hidden',
  },
  reservationTime: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  reservationTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  reservationRoom: {
    fontSize: 7,
    color: '#4B5563',
  },
  reservationActivity: {
    fontSize: 7,
    color: '#6B7280',
  },
});

interface PDFTestProps {
  selectedDate: Date;
  reservations: Reservation[];
  rooms: Room[];
  activities: Activity[];
  viewMode: 'day' | 'week';
}

const PDFTest: React.FC<PDFTestProps> = ({ selectedDate, reservations, rooms, activities, viewMode }) => {
  const startHour = 8;
  const endHour = 21;

  // Obtenir les jours à afficher selon le mode
  const getDaysToDisplay = () => {
    if (viewMode === 'day') {
      return [selectedDate];
    }
    // Pour la vue semaine, garder le comportement existant
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  };

  const weekDays = getDaysToDisplay();
  const weekStart = weekDays[0];
  const weekEnd = weekDays[weekDays.length - 1];

  // Générer tous les créneaux horaires de 30 minutes
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push({ hour, minutes: 0 });
      if (hour < endHour) {
        slots.push({ hour, minutes: 30 });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const SLOT_HEIGHT = 25; // Hauteur d'un créneau de 30 minutes
  const HEADER_HEIGHT = 30;
  const RESERVATION_OFFSET = -8; // Augmentation du décalage vers le haut

  // Fonction utilitaire pour convertir une heure en index de créneau
  const getSlotIndex = (hour: number, minutes: number) => {
    // On soustrait startHour pour commencer à l'index 0
    const hourDiff = hour - startHour;
    // Chaque heure a deux créneaux (0 et 30 minutes)
    const hourIndex = hourDiff * 2;
    // Si on est à 30 minutes, on ajoute 1 à l'index
    const minuteIndex = minutes >= 30 ? 1 : 0;
    return hourIndex + minuteIndex;
  };

  // Calculer la position verticale d'une réservation
  const calculatePosition = (time: Date) => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    // On arrondit les minutes au créneau de 30 minutes inférieur
    const roundedMinutes = Math.floor(minutes / 30) * 30;
    const slotIndex = getSlotIndex(hours, roundedMinutes);
    return (slotIndex * SLOT_HEIGHT) + RESERVATION_OFFSET;
  };

  // Calculer la hauteur d'une réservation
  const calculateHeight = (start: Date, end: Date) => {
    const startHours = start.getHours();
    const startMinutes = start.getMinutes();
    const endHours = end.getHours();
    const endMinutes = end.getMinutes();
    
    // On arrondit au créneau inférieur pour la fin
    const roundedEndMinutes = Math.floor(endMinutes / 30) * 30;
    
    const startSlotIndex = getSlotIndex(startHours, startMinutes);
    const endSlotIndex = getSlotIndex(endHours, roundedEndMinutes);
    
    const slots = endSlotIndex - startSlotIndex;
    return Math.max(slots * SLOT_HEIGHT, SLOT_HEIGHT);
  };

  // Filtrer et trier les réservations par jour et heure
  const getReservationsForDay = (day: Date) => {
    return reservations
      .filter(reservation => {
        const startTime = new Date(reservation.startTime);
        return isSameDay(startTime, day);
      })
      .sort((a, b) => {
        const startTimeA = new Date(a.startTime).getTime();
        const startTimeB = new Date(b.startTime).getTime();
        return startTimeA - startTimeB;
      });
  };

  // Obtenir les salles uniques des réservations
  const getUniqueRooms = () => {
    const uniqueRooms = new Set(reservations.map(res => res.room.name));
    return Array.from(uniqueRooms).join(' - ');
  };

  // Adapter le titre selon le mode
  const getTitle = () => {
    const roomsTitle = getUniqueRooms();
    if (viewMode === 'day') {
      return `${roomsTitle} - ${format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}`;
    }
    return roomsTitle;
  };

  // Adapter le sous-titre selon le mode
  const getSubtitle = () => {
    if (viewMode === 'day') {
      return null; // Pas de sous-titre en vue jour
    }
    return `Semaine du ${format(weekStart, 'd MMMM', { locale: fr })} au ${format(weekEnd, 'd MMMM yyyy', { locale: fr })}`;
  };

  const MyDocument = () => (
    <Document>
      <Page size="A3" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {getTitle()}
          </Text>
          {getSubtitle() && (
            <Text style={styles.subtitle}>
              {getSubtitle()}
            </Text>
          )}
        </View>

        <View style={styles.gridContainer}>
          {/* Colonne des heures */}
          <View style={styles.timeColumn}>
            <View style={[styles.dayHeader, { height: HEADER_HEIGHT }]} />
            {timeSlots.map((slot, index) => (
              <View key={index} style={[styles.timeSlot, { height: SLOT_HEIGHT }]}>
                <Text style={styles.timeText}>
                  {String(slot.hour).padStart(2, '0')}:{String(slot.minutes).padStart(2, '0')}
                </Text>
              </View>
            ))}
          </View>

          {/* Grille des jours */}
          <View style={[styles.grid, { width: viewMode === 'day' ? '95%' : '100%' }]}>
            {weekDays.map((day, index) => (
              <View key={index} style={[
                styles.dayColumn,
                viewMode === 'day' && { flex: 1 }
              ]}>
                <View style={[styles.dayHeader, { height: HEADER_HEIGHT }]}>
                  <Text style={styles.dayTitle}>
                    {format(day, 'EEEE', { locale: fr })}
                  </Text>
                  <Text style={styles.dayDate}>
                    {format(day, 'd MMMM', { locale: fr })}
                  </Text>
                </View>

                <View style={[styles.dayContent, { position: 'relative' }]}>
                  {/* Lignes horizontales pour chaque créneau horaire */}
                  {timeSlots.map((slot, index) => (
                    <View
                      key={index}
                      style={[
                        styles.hourLine,
                        {
                          top: index * SLOT_HEIGHT,
                        }
                      ]}
                    />
                  ))}

                  {/* Réservations */}
                  {getReservationsForDay(day).map((reservation, resIndex) => {
                    const startTime = new Date(reservation.startTime);
                    const endTime = new Date(reservation.endTime);
                    const top = calculatePosition(startTime);
                    const height = calculateHeight(startTime, endTime);

                    return (
                      <View 
                        key={resIndex} 
                        style={[
                          styles.reservation,
                          { 
                            position: 'absolute',
                            top: top + HEADER_HEIGHT,
                            height, 
                            left: 2,
                            right: 2,
                            backgroundColor: `${reservation.room.color}15` || '#EBF5FF',
                            borderLeftColor: reservation.room.color || '#3B82F6'
                          }
                        ]}
                      >
                        <Text style={styles.reservationTime}>
                          {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                        </Text>
                        <Text style={styles.reservationTitle} numberOfLines={1}>
                          {reservation.title}
                        </Text>
                        <Text style={styles.reservationRoom} numberOfLines={1}>
                          {reservation.room.name}
                        </Text>
                        <Text style={styles.reservationActivity} numberOfLines={1}>
                          {reservation.activity.name}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );

  // Obtenir le nom de la salle
  const roomName = rooms[0]?.name?.replace(/\s+/g, '-') || 'Toutes-les-salles';

  // Obtenir les dates de début et fin de semaine
  const startOfWeekDate = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Commence le lundi
  const endOfWeekDate = endOfWeek(selectedDate, { weekStartsOn: 1 }); // Finit le dimanche

  // Formater les dates
  const startDateStr = format(startOfWeekDate, 'dd-MM-yy', { locale: fr });
  const endDateStr = format(endOfWeekDate, 'dd-MM-yy', { locale: fr });

  // Générer le nom du fichier PDF
  const fileName = `${startDateStr}_${endDateStr}_${roomName}.pdf`;

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <PDFViewer width="100%" height="100%" filename={fileName}>
        <MyDocument />
      </PDFViewer>
    </div>
  );
};

export default PDFTest;
