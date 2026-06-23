const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getRedisClient } = require('./redis');
const logger = require('./logger');

let io;

const broadcastPresence = async (boardId) => {
  try {
    if (!io) return;
    const sockets = await io.in(`board:${boardId}`).fetchSockets();
    const activeUsers = sockets.map(s => ({
      userId: s.user?._id,
      name: s.user?.name,
      avatar: s.user?.avatar,
      email: s.user?.email,
      socketId: s.id
    })).filter(u => u.userId);

    // Remove duplicate client sessions by userId
    const uniqueUsers = Array.from(new Map(activeUsers.map(u => [u.userId.toString(), u])).values());
    io.to(`board:${boardId}`).emit('presence:update', uniqueUsers);
  } catch (error) {
    logger.error('Error broadcasting presence:', error);
  }
};

const initSocket = (server) => {
  const allowedOrigins = [
    'https://flowdesk-v2-omega.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  if (process.env.CLIENT_URL) {
    allowedOrigins.push(...process.env.CLIENT_URL.split(',').map(o => o.trim()));
  }
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(...process.env.FRONTEND_URL.split(',').map(o => o.trim()));
  }

  const isOriginAllowed = (origin) => {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;
    if (origin.endsWith('.vercel.app')) return true;
    if (allowedOrigins.includes('*')) return true;
    return false;
  };

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // 1. Configure Redis Adapter (graceful fallback to memory adapter if Redis fails)
  try {
    const pubClient = getRedisClient();
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter initialized successfully');
  } catch (error) {
    logger.warn('Socket.IO running with local memory adapter (Redis connection skipped/failed)');
  }

  // 2. Token authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access_secret_123');
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication failure:', error.message);
      return next(new Error('Authentication error: Token invalid'));
    }
  });

  // 3. Socket event handlers
  io.on('connection', (socket) => {
    logger.info(`Socket client authenticated: ${socket.id} (User: ${socket.user?.name})`);

    // Join room for workspace
    socket.on('join_workspace', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      logger.debug(`Socket ${socket.id} joined workspace room: ${workspaceId}`);
    });

    // Leave room for workspace
    socket.on('leave_workspace', (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
      logger.debug(`Socket ${socket.id} left workspace room: ${workspaceId}`);
    });

    // Join room for board & trigger presence broadcast
    socket.on('join_board', async (boardId) => {
      socket.join(`board:${boardId}`);
      logger.debug(`Socket ${socket.id} joined board room: ${boardId}`);
      await broadcastPresence(boardId);
    });

    // Leave room for board & trigger presence broadcast
    socket.on('leave_board', async (boardId) => {
      socket.leave(`board:${boardId}`);
      logger.debug(`Socket ${socket.id} left board room: ${boardId}`);
      await broadcastPresence(boardId);
    });

    // Live Cursor coordinates tracking
    socket.on('cursor:move', (data) => {
      const { boardId, x, y } = data;
      if (!boardId) return;
      socket.to(`board:${boardId}`).emit('cursor:update', {
        userId: socket.user?._id,
        name: socket.user?.name,
        x,
        y
      });
    });

    // Typing Indicators
    socket.on('typing:start', (data) => {
      const { boardId, cardId } = data;
      if (!boardId || !cardId) return;
      socket.to(`board:${boardId}`).emit('typing:update', {
        cardId,
        name: socket.user?.name,
        isTyping: true
      });
    });

    socket.on('typing:stop', (data) => {
      const { boardId, cardId } = data;
      if (!boardId || !cardId) return;
      socket.to(`board:${boardId}`).emit('typing:update', {
        cardId,
        name: socket.user?.name,
        isTyping: false
      });
    });

    // Disconnecting tracking
    socket.on('disconnecting', () => {
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room.startsWith('board:')) {
          const boardId = room.split(':')[1];
          // Execute presence recalculation in next tick after client departs the rooms
          setTimeout(() => {
            broadcastPresence(boardId);
          }, 50);
        }
      });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
};

module.exports = { initSocket, getIO };
