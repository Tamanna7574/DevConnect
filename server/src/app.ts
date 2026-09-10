import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { ENV } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';

export const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Resilient CORS configuration supporting multiple production origins and credentials
export const allowedOrigins = Array.from(
  new Set([
    ...ENV.CLIENT_URL.split(',').map((u) => u.trim().replace(/\/$/, '')),
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ])
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser(ENV.COOKIE_SECRET));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use('/api', apiLimiter);

// Serve local uploads folder statically
const localUploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(localUploadsDir));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    message: 'DevConnect API service is healthy',
  });
});

// Mount Main API routes
app.use('/api', apiRouter);

// In production, serve frontend client assets if built in client/dist
const possibleClientDistPaths = [
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
];
const activeClientDist = possibleClientDistPaths.find((p) => fs.existsSync(p));

if (activeClientDist) {
  app.use(express.static(activeClientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(activeClientDist, 'index.html'));
  });
}

// Centralized error handling
app.use(errorHandler);
