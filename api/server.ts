import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Redis from 'ioredis';
import { setupWebSocket } from './websocket/socket';
import { reservationRoutes } from './routes/reservations';
import { roomRoutes } from './routes/rooms';
import { activityRoutes } from './routes/activities';
import { authRoutes } from './routes/auth';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost", "http://localhost:80"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Redis client pour la synchronisation
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/activities', activityRoutes);

// WebSocket setup
setupWebSocket(io, redis);

// Gestionnaire d'erreurs global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
