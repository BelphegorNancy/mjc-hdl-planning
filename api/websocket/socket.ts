import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { Reservation } from '../../src/types';

export const setupWebSocket = (io: Server, redis: Redis) => {
  // Garder une trace des utilisateurs connectés
  const connectedUsers = new Map();

  io.on('connection', (socket: Socket) => {
    console.log('New client connected');

    // Authentification du client
    socket.on('authenticate', (userId: string) => {
      connectedUsers.set(socket.id, userId);
      socket.join(`user:${userId}`);
      console.log(`User ${userId} authenticated`);
    });

    // Gestion des réservations
    socket.on('startEditingReservation', async (reservationId: string) => {
      const userId = connectedUsers.get(socket.id);
      if (!userId) return;

      const lockKey = `lock:reservation:${reservationId}`;
      const currentEditor = await redis.get(lockKey);

      if (currentEditor && currentEditor !== userId) {
        // La réservation est déjà en cours d'édition
        socket.emit('reservationLocked', {
          reservationId,
          editorId: currentEditor
        });
      } else {
        // Verrouiller la réservation pour cet utilisateur
        await redis.set(lockKey, userId, 'EX', 300); // Expire après 5 minutes
        socket.join(`editing:${reservationId}`);
        io.emit('reservationEditStarted', {
          reservationId,
          editorId: userId
        });
      }
    });

    socket.on('stopEditingReservation', async (reservationId: string) => {
      const userId = connectedUsers.get(socket.id);
      if (!userId) return;

      const lockKey = `lock:reservation:${reservationId}`;
      await redis.del(lockKey);
      socket.leave(`editing:${reservationId}`);
      io.emit('reservationEditStopped', {
        reservationId,
        editorId: userId
      });
    });

    socket.on('reservationUpdated', (reservation: Reservation) => {
      // Notifier tous les autres clients de la mise à jour
      socket.broadcast.emit('reservationChanged', reservation);
    });

    socket.on('reservationCreated', (reservation: Reservation) => {
      // Notifier tous les autres clients de la nouvelle réservation
      socket.broadcast.emit('newReservation', reservation);
    });

    socket.on('reservationDeleted', (reservationId: string) => {
      // Notifier tous les autres clients de la suppression
      socket.broadcast.emit('deletedReservation', reservationId);
    });

    // Déconnexion
    socket.on('disconnect', async () => {
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        // Libérer tous les verrous de cet utilisateur
        const userLocks = await redis.keys(`lock:reservation:*`);
        for (const lockKey of userLocks) {
          const lockOwner = await redis.get(lockKey);
          if (lockOwner === userId) {
            await redis.del(lockKey);
            const reservationId = lockKey.split(':')[2];
            io.emit('reservationEditStopped', {
              reservationId,
              editorId: userId
            });
          }
        }
        connectedUsers.delete(socket.id);
      }
      console.log('Client disconnected');
    });
  });
};
