import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
const DIST_DIR = path.join(__dirname, '..', 'dist');
app.use(express.static(DIST_DIR));

// Socket.io - Solo para presencia de usuarios y notificaciones
const connectedUsers = new Map(); // username -> socket.id

io.on('connection', (socket) => {
  console.log('Nueva conexión:', socket.id);

  // Usuario se conecta
  socket.on('user-online', ({ uid, username }) => {
    if (username) {
      console.log(`Usuario online: ${username}`);
      connectedUsers.set(username, socket.id);
      socket.username = username;
      
      // Notificar a todos los usuarios conectados
      io.emit('online-users', Array.from(connectedUsers.keys()));
      socket.broadcast.emit('user-online', { username });
    }
  });

  // Notificar nuevo mensaje
  socket.on('new-message', ({ to, from, content }) => {
    const recipientSocketId = connectedUsers.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('new-message-notification', { from, content });
    }
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log('Desconexión:', socket.id);
    if (socket.username) {
      connectedUsers.delete(socket.username);
      io.emit('online-users', Array.from(connectedUsers.keys()));
      socket.broadcast.emit('user-offline', { username: socket.username });
    }
  });
});

// Ruta catch-all para el frontend (SPA)
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Abre http://localhost:${PORT} en tu navegador`);
});