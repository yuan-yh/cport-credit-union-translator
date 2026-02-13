// =============================================================================
// CPORT CREDIT UNION TRANSLATION TOOL - SERVER ENTRY POINT
// =============================================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const { initializeSchema, seedDatabase } = require('./database');

// Import routes
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const translationRoutes = require('./routes/translations');
const queueRoutes = require('./routes/queue');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');

// =============================================================================
// APP INITIALIZATION
// =============================================================================

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);

// =============================================================================
// MIDDLEWARE
// =============================================================================

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/queue', queueRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// =============================================================================
// SOCKET.IO SETUP
// =============================================================================

const socketHandler = require('./socket');
socketHandler(io);

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

async function initializeDatabase() {
  try {
    initializeSchema();
    await seedDatabase();
    console.log('✓ Database ready');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// =============================================================================
// SERVER START
// =============================================================================

const PORT = process.env.PORT || 3001;

async function start() {
  await initializeDatabase();
  
  server.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  cPort Credit Union Translation Tool - API Server');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Port:     ${PORT}`);
    console.log(`  Env:      ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Client:   ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
  });
}

start().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
