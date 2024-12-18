import React from 'react';
import { createContext, useContext } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Room, Activity, Reservation, AuditLog } from '../types';
import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3001/api';

interface Store {
  users: User[];
  rooms: Room[];
  activities: Activity[];
  reservations: Reservation[];
  auditLogs: AuditLog[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  setCurrentUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<void>;
  fetchData: () => Promise<void>;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      users: [],
      rooms: [],
      activities: [],
      reservations: [],
      auditLogs: [],
      currentUser: null,
      isLoading: false,
      error: null,
      
      setCurrentUser: (user) => set({ currentUser: user }),

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });

          if (!response.ok) {
            throw new Error('Login failed');
          }

          const { user } = await response.json();
          set({ currentUser: user, isLoading: false });
        } catch (error) {
          set({ error: 'Login failed', isLoading: false });
          throw error;
        }
      },

      fetchData: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/data`);
          if (!response.ok) {
            throw new Error('Failed to fetch data');
          }
          const data = await response.json();
          set({ ...data, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to fetch data', isLoading: false });
          console.error('Failed to fetch data:', error);
        }
      },
    }),
    {
      name: 'hdl-storage',
    }
  )
);

const StoreContext = createContext<ReturnType<typeof useStore> | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useStore();
  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStoreContext = () => {
  const store = useContext(StoreContext);
  if (!store) throw new Error('Store not found');
  return store;
};