import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Reservation, Room, Activity } from '../types';

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
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
  daySection: {
    marginBottom: 15,
  },
  dayTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#F3F4F6',
    padding: 5,
    marginBottom: 10,
  },
  reservation: {
    marginBottom: 8,
    padding: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    borderLeftStyle: 'solid',
  },
  reservationTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  reservationDetails: {
    fontSize: 10,
    color: '#4B5563',
  },
  noReservation: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#6B7280',
    textAlign: 'center',
    padding: 10,
  },
});

interface PDFListViewProps {
  selectedDate: Date;
  reservations: Reservation[];
  rooms: Room[];
  activities: Activity[];
  viewMode: 'day' | 'week';
}

const PDFListView: React.FC<PDFListViewProps> = ({ selectedDate, reservations, rooms, activities, viewMode }) => {
  // Obtenir les jours à afficher en fonction du mode
  const days = React.useMemo(() => {
    if (viewMode === 'day') {
      return [selectedDate];
    } else {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
  }, [selectedDate, viewMode]);

  // Trier et grouper les réservations par jour
  const groupedReservations = React.useMemo(() => {
    const groups: { [key: string]: Reservation[] } = {};
    
    // Initialiser tous les jours avec un tableau vide
    days.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      groups[dateKey] = [];
    });

    // Ajouter les réservations aux jours correspondants
    reservations
      .map(reservation => ({
        ...reservation,
        startTime: new Date(reservation.startTime),
        endTime: new Date(reservation.endTime)
      }))
      .forEach(reservation => {
        const dateKey = format(reservation.startTime, 'yyyy-MM-dd');
        if (groups[dateKey]) {
          groups[dateKey].push(reservation);
        }
      });

    // Trier les réservations de chaque jour par heure de début
    Object.keys(groups).forEach(dateKey => {
      groups[dateKey].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    });

    return groups;
  }, [reservations, days]);

  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Planning {viewMode === 'week' ? 'Hebdomadaire' : 'Journalier'} - {
              rooms.map(room => room.name).join(', ')
            }
          </Text>
        </View>

        {days.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayReservations = groupedReservations[dateKey] || [];

          return (
            <View key={index} style={styles.daySection}>
              <Text style={styles.dayTitle}>
                {format(day, 'EEEE d MMMM yyyy', { locale: fr })}
              </Text>

              {dayReservations.length > 0 ? (
                dayReservations.map((reservation, rIndex) => (
                  <View key={rIndex} style={styles.reservation}>
                    <Text style={styles.reservationTitle}>
                      {reservation.title || reservation.activity.name}
                    </Text>
                    <Text style={styles.reservationDetails}>
                      {format(reservation.startTime, 'HH:mm')} - {format(reservation.endTime, 'HH:mm')}
                      {' • '}{reservation.room.name}
                      {' • '}{reservation.activity.name}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noReservation}>
                  Aucune réservation pour cette journée
                </Text>
              )}
            </View>
          );
        })}
      </Page>
    </Document>
  );

  // Obtenir le nom de la salle et la date formatée pour le nom du fichier
  const roomName = rooms[0]?.name?.replace(/\s+/g, '-') || 'Toutes-les-salles';
  const startOfWeekDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const endOfWeekDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const startDateStr = format(startOfWeekDate, 'dd-MM-yy', { locale: fr });
  const endDateStr = format(endOfWeekDate, 'dd-MM-yy', { locale: fr });
  const fileName = `${startDateStr}_${endDateStr}_${roomName}.pdf`;

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <PDFViewer width="100%" height="100%" filename={fileName}>
        <MyDocument />
      </PDFViewer>
    </div>
  );
};

export default PDFListView;
