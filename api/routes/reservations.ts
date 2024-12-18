import express, { Request, Response, NextFunction } from 'express';
import { Reservation } from '../../src/types';
import Database from 'better-sqlite3';

const router = express.Router();
const db = new Database('data/database.sqlite');

// Middleware pour vérifier les chevauchements
const checkOverlap = (req: Request, res: Response, next: NextFunction): void => {
  const { startTime, endTime, roomId } = req.body;
  const reservationId = req.params.id;

  console.log('Checking overlap:', {
    startTime,
    endTime,
    roomId,
    reservationId
  });

  if (!startTime || !endTime || !roomId) {
    res.status(400).json({ error: 'Données manquantes pour la vérification des chevauchements' });
    return;
  }

  try {
    // Convertir les dates au format ISO
    let parsedStartTime: Date, parsedEndTime: Date;
    
    if (startTime.includes('/')) {
      const [date, time] = startTime.split(' ');
      const [day, month, year] = date.split('/');
      const [hours, minutes] = time.split(':');
      parsedStartTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
    } else {
      parsedStartTime = new Date(startTime);
    }

    if (endTime.includes('/')) {
      const [date, time] = endTime.split(' ');
      const [day, month, year] = date.split('/');
      const [hours, minutes] = time.split(':');
      parsedEndTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
    } else {
      parsedEndTime = new Date(endTime);
    }

    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      throw new Error('Invalid date format');
    }

    const isoStartTime = parsedStartTime.toISOString();
    const isoEndTime = parsedEndTime.toISOString();

    console.log('Checking overlap with ISO dates:', {
      isoStartTime,
      isoEndTime,
      roomId,
      reservationId
    });

    const overlapping = db.prepare(`
      SELECT * FROM reservations 
      WHERE room_id = ? 
      AND id != ? 
      AND ((start_time < ? AND end_time > ?) 
      OR (start_time < ? AND end_time > ?) 
      OR (start_time >= ? AND end_time <= ?))
    `).all(roomId, reservationId || '', isoEndTime, isoStartTime, isoStartTime, isoEndTime, isoStartTime, isoEndTime);

    console.log('Overlapping reservations:', overlapping);

    if (overlapping.length > 0) {
      res.status(409).json({ error: 'Cette plage horaire chevauche une réservation existante' });
      return;
    }

    // Ajouter les dates parsées à la requête pour les utiliser dans le handler
    req.body.parsedStartTime = parsedStartTime;
    req.body.parsedEndTime = parsedEndTime;

    next();
  } catch (error) {
    console.error('Error in checkOverlap:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification des chevauchements' });
  }
};

// Routes
router.get('/', (req: Request, res: Response): void => {
  try {
    console.log('GET /reservations - Fetching reservations');
    
    // Récupérer toutes les réservations avec leurs salles et activités
    const reservations = db.prepare(`
      SELECT 
        r.*,
        rm.id as room_id,
        rm.name as room_name,
        rm.created_at as room_created_at,
        a.id as activity_id,
        a.name as activity_name,
        a.created_at as activity_created_at
      FROM reservations r
      INNER JOIN rooms rm ON r.room_id = rm.id
      INNER JOIN activities a ON r.activity_id = a.id
      ORDER BY r.start_time ASC
    `).all();

    // Transformer les résultats pour correspondre au format attendu
    const formattedReservations = reservations.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      startTime: r.start_time,
      endTime: r.end_time,
      createdAt: r.created_at,
      room: {
        id: r.room_id,
        name: r.room_name,
        createdAt: r.room_created_at
      },
      activity: {
        id: r.activity_id,
        name: r.activity_name,
        createdAt: r.activity_created_at
      }
    }));

    res.json(formattedReservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des réservations' });
  }
});

router.post('/', checkOverlap, (req: Request, res: Response): void => {
  try {
    const { roomId, activityId, title, description, createdBy, parsedStartTime, parsedEndTime } = req.body;
    
    console.log('Creating reservation:', {
      parsedStartTime,
      parsedEndTime,
      roomId,
      activityId,
      title,
      description,
      createdBy
    });
    
    // Vérifier les champs requis
    if (!parsedStartTime || !parsedEndTime || !roomId || !activityId) {
      res.status(400).json({ error: 'Champs requis manquants' });
      return;
    }

    // Vérifier que la salle existe
    const room = db.prepare('SELECT id FROM rooms WHERE id = ?').get(roomId);
    if (!room) {
      console.error('Room not found:', roomId);
      res.status(404).json({ error: 'Salle non trouvée' });
      return;
    }

    // Vérifier que l'activité existe
    const activity = db.prepare('SELECT id FROM activities WHERE id = ?').get(activityId);
    if (!activity) {
      console.error('Activity not found:', activityId);
      res.status(404).json({ error: 'Activité non trouvée' });
      return;
    }
    
    const result = db.prepare(`
      INSERT INTO reservations (
        start_time, 
        end_time, 
        room_id, 
        activity_id, 
        title, 
        description, 
        created_by,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      parsedStartTime.toISOString(),
      parsedEndTime.toISOString(),
      roomId,
      activityId,
      title || null,
      description || null,
      createdBy
    );

    console.log('Reservation created:', {
      id: result.lastInsertRowid,
      changes: result.changes
    });

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de la réservation',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

router.put('/:id', checkOverlap, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { startTime, endTime, roomId, activityId, title, description } = req.body;

    const result = db.prepare(`
      UPDATE reservations 
      SET start_time = ?, end_time = ?, room_id = ?, activity_id = ?, title = ?, description = ?
      WHERE id = ?
    `).run(startTime, endTime, roomId, activityId, title, description, id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Réservation non trouvée' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la réservation' });
  }
});

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM reservations WHERE id = ?').run(id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Réservation non trouvée' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la réservation' });
  }
});

export const reservationRoutes = router;
