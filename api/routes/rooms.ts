import express from 'express';
import { Room } from '../../src/types';

const router = express.Router();

// Liste des salles (exemple)
const rooms: Room[] = [
  {
    id: '1',
    name: 'Salle de Danse',
    capacity: 30,
    equipment: ['Miroirs', 'Barres', 'Système audio'],
    color: '#FF5733',
    createdBy: 'system',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Salle de Musique',
    capacity: 15,
    equipment: ['Piano', 'Pupitres', 'Isolation acoustique'],
    color: '#33FF57',
    createdBy: 'system',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'Salle Polyvalente',
    capacity: 50,
    equipment: ['Tables', 'Chaises', 'Projecteur'],
    color: '#3357FF',
    createdBy: 'system',
    createdAt: new Date('2024-01-01')
  }
];

// GET /api/rooms
router.get('/', (req, res) => {
  res.json(rooms);
});

// GET /api/rooms/:id
router.get('/:id', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (room) {
    res.json(room);
  } else {
    res.status(404).json({ message: 'Salle non trouvée' });
  }
});

export const roomRoutes = router;
