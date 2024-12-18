import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration de la base de données SQLite
const dbFile = path.join(__dirname, '../data/database.sqlite');

// Assurez-vous que le répertoire data existe
const dataDir = path.dirname(dbFile);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Fonction pour initialiser la base de données
async function initializeDatabase() {
  const db = await open({
    filename: dbFile,
    driver: sqlite3.Database
  });

  // Créer les tables si elles n'existent pas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      roomId TEXT NOT NULL,
      activityId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      updatedBy TEXT NOT NULL
    );
  `);

  return db;
}

const app = express();

// Configuration CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost',
  credentials: true
}));

app.use(express.json());

// Middleware pour la connexion à la base de données
app.use(async (req, res, next) => {
  try {
    req.db = await initializeDatabase();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Routes
app.get('/api/reservations', async (req, res) => {
  try {
    const reservations = await req.db.all('SELECT * FROM reservations');
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

app.post('/api/reservations', async (req, res) => {
  console.log('\n=== Creating new reservation ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const {
      id,
      title,
      start,
      end,
      roomId,
      activityId,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy
    } = req.body;

    await req.db.run(
      `INSERT INTO reservations (id, title, start, end, roomId, activityId, createdAt, updatedAt, createdBy, updatedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, start, end, roomId, activityId, createdAt, updatedAt, createdBy, updatedBy]
    );

    const newReservation = await req.db.get('SELECT * FROM reservations WHERE id = ?', id);
    res.status(201).json(newReservation);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

app.put('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      start,
      end,
      roomId,
      activityId,
      updatedAt,
      updatedBy
    } = req.body;

    await req.db.run(
      `UPDATE reservations 
       SET title = ?, start = ?, end = ?, roomId = ?, activityId = ?, updatedAt = ?, updatedBy = ?
       WHERE id = ?`,
      [title, start, end, roomId, activityId, updatedAt, updatedBy, id]
    );

    const updatedReservation = await req.db.get('SELECT * FROM reservations WHERE id = ?', id);
    res.json(updatedReservation);
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ error: 'Failed to update reservation' });
  }
});

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await req.db.run('DELETE FROM reservations WHERE id = ?', id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ error: 'Failed to delete reservation' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await req.db.get('SELECT * FROM users WHERE username = ?', username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Initialiser les utilisateurs par défaut
async function initializeDefaultUsers(db) {
  const defaultUsers = [
    {
      id: '1',
      username: 'accueil',
      password: 'accueil',
      role: 'ADMIN'
    },
    {
      id: '2',
      username: 'bknl',
      password: 'bknl',
      role: 'USER'
    }
  ];

  for (const user of defaultUsers) {
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', user.username);
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await db.run(
        'INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
        [user.id, user.username, hashedPassword, user.role]
      );
    }
  }
}

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  try {
    const db = await initializeDatabase();
    await initializeDefaultUsers(db);
    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
});
