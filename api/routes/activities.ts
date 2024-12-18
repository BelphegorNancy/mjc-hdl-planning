import express from 'express';
import { Activity } from '../../src/types';

const router = express.Router();

// Liste des activités (exemple)
const activities: Activity[] = [
  {
    id: '1',
    name: 'Danse Classique',
    description: 'Cours de danse classique pour tous niveaux',
    instructor: 'Marie Dupont',
    category: 'Danse'
  },
  {
    id: '2',
    name: 'Piano',
    description: 'Cours de piano individuels',
    instructor: 'Jean Martin',
    category: 'Musique'
  },
  {
    id: '3',
    name: 'Théâtre',
    description: 'Atelier de théâtre pour adultes',
    instructor: 'Sophie Dubois',
    category: 'Arts dramatiques'
  }
];

// GET /api/activities
router.get('/', (req, res) => {
  res.json(activities);
});

// GET /api/activities/:id
router.get('/:id', (req, res) => {
  const activity = activities.find(a => a.id === req.params.id);
  if (activity) {
    res.json(activity);
  } else {
    res.status(404).json({ message: 'Activité non trouvée' });
  }
});

export const activityRoutes = router;
