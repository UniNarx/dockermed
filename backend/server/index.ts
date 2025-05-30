
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import type { ListenOptions } from 'net';
import appConfig from './config/index';
import connectDB from './utils/db';
import { seedRoles, seedSuperAdmin } from './utils/seed';


import { setupWebSocketServer } from './services/chatSocketService';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import patientRoutes from './routes/patientRoutes';
import doctorRoutes from './routes/doctorRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import medicalRecordRoutes from './routes/medicalRecordRoutes';
import profileRoutes from './routes/profileRoutes';
import chatRoutes from './routes/chatRoutes';

const app: Express = express();
const httpServer = http.createServer(app);
const port = appConfig.port;
const portNumber = parseInt(appConfig.port, 10);

if (isNaN(portNumber)) {
  console.error(`[server/index] Неверный PORT в конфиге: ${appConfig.port}`);
  process.exit(1);
}


const startServer = async () => {
  await connectDB();
  await seedRoles();
  await seedSuperAdmin();

  console.log(`[server/index] Используется порт для Express: ${port}`);
  console.log(`[server/index] JWT Secret (первые 3 символа): ${appConfig.jwtSecret.substring(0, 3)}...`);
  console.log(`[server/index] MONGO_URI (начало): ${appConfig.mongoURI.split('/').slice(0,3).join('/')}/...`);
app.get('/', (_req, res) => {
  res.send('OK');
});
  app.use(cors({
      origin: process.env.FRONTEND_URL || 'http:
      credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[Express App] Incoming request: ${req.method} ${req.originalUrl}`);
    next();
  });


  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/medical-records', medicalRecordRoutes);
  app.use('/api/profiles', profileRoutes);
  app.use('/api/chat', chatRoutes);

  app.get('/hello', (req: Request, res: Response) => {
    res.json({ message: `Привет от отдельного Express сервера! Порт: ${port}` });
  });


  setupWebSocketServer(httpServer);

  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[Express App] 404 - Route not found in Express: ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
      res.status(404).json({ message: 'Запрашиваемый ресурс не найден на API сервере' });
    }
  });

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[Express App] Глобальная ошибка Express:', err.message, err.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Внутренняя ошибка сервера API', error: err.message });
    }
  });


httpServer.listen(
  portNumber,
  '0.0.0.0',
  () => {
    console.log(`✅ Express API и WebSocket запущены на http:
  }
);


};

startServer().catch(error => {
  console.error("Критическая ошибка при запуске сервера:", error);
  process.exit(1);
});
