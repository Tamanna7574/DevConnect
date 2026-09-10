import http from 'http';
import { app } from './app.js';
import { ENV } from './config/env.js';
import { initSocketServer } from './sockets/socket.js';
import { prisma } from './config/prisma.js';

const httpServer = http.createServer(app);

// Initialize Socket.io server
initSocketServer(httpServer);

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('Successfully connected to PostgreSQL database with Prisma.');

    httpServer.listen(ENV.PORT, () => {
      console.log(`DevConnect Server running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
      console.log(`Socket.io initialized and listening for real-time events.`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing HTTP server and Prisma client...');
  httpServer.close(async () => {
    await prisma.$disconnect();
    console.log('Server terminated cleanly.');
    process.exit(0);
  });
});

startServer();
