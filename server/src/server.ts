import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { env } from './config/env';

const server = http.createServer(app);

// Initialize Socket.IO instance for real-time telemetry
export const io = new SocketIOServer(server, {
  cors: {
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`⚡ [Socket.IO] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ [Socket.IO] Client disconnected: ${socket.id}`);
  });
});

const PORT = env.PORT;

server.listen(PORT, () => {
  console.log(`
🚀 Developer Command Center API
📡 Server running on http://localhost:${PORT}
❤️ Health: http://localhost:${PORT}/api/health
  `);
});

// Process signal & error management
process.on('unhandledRejection', (err: Error) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down gracefully...', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err: Error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down immediately...', err);
  process.exit(1);
});
