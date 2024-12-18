import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Room, Activity, Reservation, HistoryEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

const API_URL = '/api';

interface State {
  currentUser: User | null;
  rooms: Room[];
  activities: Activity[];
  reservations: Reservation[];
  history: HistoryEntry[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  reloadData: () => Promise<void>;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      currentUser: null,
      rooms: [],
      activities: [],
      reservations: [],
      history: [],

      reloadData: async () => {
        const state = useStore.getState();
        const token = state.currentUser?.token;
        console.log('Reloading data with token:', token);
        if (!token) return;

        try {
          console.log('Making API calls to:', `${API_URL}/reservations`, `${API_URL}/rooms`, `${API_URL}/activities`);
          const [reservationsRes, roomsRes, activitiesRes] = await Promise.all([
            fetch(`${API_URL}/reservations`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }),
            fetch(`${API_URL}/rooms`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }),
            fetch(`${API_URL}/activities`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }),
          ]);

          console.log('API responses:', {
            reservations: reservationsRes.status,
            rooms: roomsRes.status,
            activities: activitiesRes.status
          });

          if (reservationsRes.ok && roomsRes.ok && activitiesRes.ok) {
            const [reservations, rooms, activities] = await Promise.all([
              reservationsRes.json(),
              roomsRes.json(),
              activitiesRes.json(),
            ]);

            console.log('Raw API data:', {
              reservations,
              rooms,
              activities
            });

            // Vérifier la validité des données
            const validReservations = reservations.filter((res: any) => {
              try {
                if (!res) {
                  console.error('Reservation is null or undefined');
                  return false;
                }
                
                // Vérification détaillée de la structure
                const isValid = 
                  res.room && 
                  typeof res.room === 'object' &&
                  res.room.id &&
                  res.activity &&
                  typeof res.activity === 'object' &&
                  res.activity.id &&
                  res.startTime &&
                  res.endTime;

                if (!isValid) {
                  console.error('Invalid reservation structure:', {
                    hasRoom: !!res.room,
                    roomType: typeof res.room,
                    hasRoomId: res.room?.id,
                    hasActivity: !!res.activity,
                    activityType: typeof res.activity,
                    hasActivityId: res.activity?.id,
                    hasStartTime: !!res.startTime,
                    hasEndTime: !!res.endTime
                  });
                }

                return isValid;
              } catch (error) {
                console.error('Error validating reservation:', error);
                return false;
              }
            });

            if (validReservations.length !== reservations.length) {
              console.warn(`Found ${reservations.length - validReservations.length} invalid reservations`);
              console.log('Valid reservations:', validReservations);
            }

            console.log('Loaded data:', {
              reservationsCount: validReservations.length,
              roomsCount: rooms.length,
              activitiesCount: activities.length
            });

            set({
              reservations: validReservations,
              rooms,
              activities,
            });
          } else {
            console.error('Some API calls failed:', {
              reservations: await reservationsRes.text(),
              rooms: await roomsRes.text(),
              activities: await activitiesRes.text()
            });
          }
        } catch (error) {
          console.error('Error reloading data:', error);
        }
      },

      login: async (username: string, password: string) => {
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });

          const data = await response.json();
          console.log('Login response:', data);

          if (response.ok && data.success && data.user && data.user.token) {
            set({ currentUser: data.user });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },

      logout: () => {
        set({
          currentUser: null,
          reservations: [],
          rooms: [],
          activities: [],
        });
      },

      addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
        const newEntry: HistoryEntry = {
          ...entry,
          id: uuidv4(),
          timestamp: new Date().toISOString(),
        };
        set(state => ({
          history: [...state.history, newEntry]
        }));
      },
    }),
    {
      name: 'hdl-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        rooms: state.rooms,
        activities: state.activities,
        reservations: state.reservations,
      }),
    }
  )
);