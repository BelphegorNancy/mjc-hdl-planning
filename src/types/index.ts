export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  role: 'superadmin' | 'user';
  name: string;
  createdAt: Date;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  color?: string;
  equipment?: string[];
  description?: string;
  createdBy: string;
  createdAt: Date;
  currentOccupancy?: number;
}

export interface Activity {
  id: string;
  name: string;
  description?: string;
  requirements?: string[];
  createdBy?: string;
  createdAt?: Date;
}

export interface Reservation {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  room: Room;
  activity: Activity;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

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
  details: string;
  userId?: string;
}
