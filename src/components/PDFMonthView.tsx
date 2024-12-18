import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Reservation, Room, Activity } from '../types';

interface PDFMonthViewProps {
  selectedDate: Date;
  reservations: Reservation[];
  rooms: Room[];
  activities: Activity[];
}

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#112233',
    borderBottomStyle: 'solid',
    paddingBottom: 5,
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
    marginBottom: 5,
    textAlign: 'center',
    color: '#4B5563',
  },
  calendar: {
    width: '100%',
  },
  weekDays: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekDay: {
    width: '14.28%',
    padding: 5,
    fontSize: 8,
    textAlign: 'center',
    color: '#4B5563',
    fontWeight: 'bold',
  },
  week: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  day: {
    width: '14.28%',
    minHeight: 80,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  dayNumber: {
    fontSize: 10,
    marginBottom: 5,
    color: '#1F2937',
  },
  dayNumberOutside: {
    color: '#9CA3AF',
  },
  dayNumberToday: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    borderRadius: '50%',
    width: 16,
    height: 16,
    textAlign: 'center',
    padding: 2,
  },
  reservation: {
    fontSize: 6,
    marginBottom: 2,
    padding: 2,
    borderRadius: 2,
  },
});

const PDFMonthView: React.FC<PDFMonthViewProps> = ({
  selectedDate,
  reservations,
  rooms,
  activities,
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

  // Créer les semaines
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  calendarDays.forEach((day) => {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Jours de la semaine en français
  const weekDays = eachDayOfInterval({
    start: calendarStart,
    end: endOfWeek(calendarStart, { locale: fr, weekStartsOn: 1 }),
  }).map(day => format(day, 'EEE', { locale: fr }));

  // Fonction pour obtenir les réservations d'un jour donné
  const getDayReservations = (day: Date) => {
    return reservations.filter(reservation => 
      isSameDay(new Date(reservation.startTime), day)
    );
  };

  return (
    <PDFViewer style={{ width: '100%', height: '100%' }}>
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Planning du Mois</Text>
            <Text style={styles.subtitle}>
              {format(selectedDate, 'MMMM yyyy', { locale: fr })}
            </Text>
          </View>

          <View style={styles.calendar}>
            <View style={styles.weekDays}>
              {weekDays.map((day) => (
                <View key={day} style={styles.weekDay}>
                  <Text>{day}</Text>
                </View>
              ))}
            </View>

            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.week}>
                {week.map((day, dayIndex) => {
                  const dayReservations = getDayReservations(day);
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonth = isSameMonth(day, selectedDate);

                  return (
                    <View key={dayIndex} style={styles.day}>
                      <Text style={[
                        styles.dayNumber,
                        !isCurrentMonth && styles.dayNumberOutside,
                        isToday && styles.dayNumberToday,
                      ]}>
                        {format(day, 'd')}
                      </Text>
                      {dayReservations.map((reservation, idx) => (
                        <View 
                          key={idx} 
                          style={[
                            styles.reservation,
                            {
                              backgroundColor: `${reservation.room.color}20`,
                              borderLeftWidth: 2,
                              borderLeftColor: reservation.room.color,
                            }
                          ]}
                        >
                          <Text>
                            {format(new Date(reservation.startTime), 'HH:mm')} - {reservation.room.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </Page>
      </Document>
    </PDFViewer>
  );
};

export default PDFMonthView;
