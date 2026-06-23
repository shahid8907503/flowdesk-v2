require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');

const requestLogger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { setupSwagger } = require('./config/swagger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const boardRoutes = require('./routes/boardRoutes');
const columnRoutes = require('./routes/columnRoutes');
const cardRoutes = require('./routes/cardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const auditRoutes = require('./routes/auditRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Security and utility middlewares
app.use(helmet());
// Configure CORS allowed origins
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

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(requestLogger);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setup Swagger UI
setupSwagger(app);

// Apply rate limiter to general api calls
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  // Calculate uptime
  const uptimeSeconds = process.uptime();
  const uptimeString = new Date(uptimeSeconds * 1000).toISOString().substr(11, 8);

  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    success: true,
    status: 'healthy',
    uptime: uptimeString,
    database: dbStatus,
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`
    },
    timestamp: new Date()
  });
});

// Register routers
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/ai', aiRoutes);

// Catch 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.url}`
  });
});

// Central error handler
app.use(errorHandler);

module.exports = app;
