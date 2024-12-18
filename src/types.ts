export interface Room {
  id: string;
  name: string;
  capacity: number;
  currentOccupancy?: number;
  color: string;
  equipment: string[];
  createdBy: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  instructor: string;
  category: string;
  requirements?: string[];
  createdBy?: string;
  createdAt?: Date;
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface RecurrenceInfo {
  type: RecurrenceType;
  endDate?: Date;
  interval?: number; // Pour répéter tous les X jours/semaines/mois
  daysOfWeek?: number[]; // Pour la récurrence hebdomadaire (0-6, 0 = dimanche)
}

export interface Reservation {
  id: string;
  roomId: string;
  activityId: string;
  startTime: Date;
  endTime: Date;
  title?: string;
  description?: string;
  room: Room;
  activity: Activity;
  createdBy: string;
  createdAt: Date;
  notes?: string; // Notes complémentaires optionnelles
  recurrence?: RecurrenceInfo;
  parentReservationId?: string; // Pour lier les réservations récurrentes
}

export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  role: 'superadmin' | 'admin' | 'manager' | 'user' | 'reader';
  createdAt: Date;
  createdBy?: string;
  lastLogin?: Date;
}

export interface AuditLog {
  id: string;
  action: 'login' | 'create' | 'update' | 'delete';
  entityType: 'user' | 'room' | 'activity' | 'reservation';
  entityId: string;
  userId: string;
  details: string;
  timestamp: Date;
}

export type ViewMode = 'day' | '3days' | 'week';

export type HistoryActionType = 
  | 'USER_LOGIN' 
  | 'USER_LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'RESERVATION_CREATED'
  | 'RESERVATION_UPDATED'
  | 'RESERVATION_DELETED';

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  actionType: HistoryActionType;
  userId: string;
  username: string;
  details: string;
  metadata?: {
    reservationId?: string;
    roomName?: string;
    activityName?: string;
    targetUserId?: string;
    targetUsername?: string;
  };
}

export const SUPER_ADMIN: User = {
  id: 'super-admin',
  username: 'BKNL',
  password: '@@Ght2cd@@',
  email: 'admin@mjc-hdl.fr',
  role: 'superadmin',
  createdAt: new Date('2024-01-01'),
};