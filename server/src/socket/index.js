// =============================================================================
// SOCKET.IO HANDLER
// =============================================================================

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

module.exports = function socketHandler(io) {
  // Authentication middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        branchId: decoded.branchId,
        firstName: decoded.firstName,
      };
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    console.log(`✓ User connected: ${user.firstName} (${user.role})`);

    // Automatically join branch room
    socket.join(`branch:${user.branchId}`);
    socket.join(`user:${user.id}`);

    // ==========================================================================
    // SESSION EVENTS
    // ==========================================================================

    socket.on('session:join', (sessionId) => {
      socket.join(`session:${sessionId}`);
      console.log(`  → ${user.firstName} joined session ${sessionId}`);
    });

    socket.on('session:leave', (sessionId) => {
      socket.leave(`session:${sessionId}`);
      console.log(`  ← ${user.firstName} left session ${sessionId}`);
    });

    // ==========================================================================
    // TRANSLATION EVENTS (Real-time streaming)
    // ==========================================================================

    socket.on('translation:start', (data) => {
      // Broadcast that translation is starting
      socket.to(`session:${data.sessionId}`).emit('translation:started', {
        sessionId: data.sessionId,
        speakerType: data.speakerType,
        language: data.language,
      });
    });

    socket.on('translation:streaming', (data) => {
      // Broadcast partial translation
      socket.to(`session:${data.sessionId}`).emit('translation:partial', data);
    });

    // ==========================================================================
    // QUEUE EVENTS
    // ==========================================================================

    socket.on('queue:subscribe', () => {
      socket.join(`queue:${user.branchId}`);
    });

    socket.on('queue:unsubscribe', () => {
      socket.leave(`queue:${user.branchId}`);
    });

    // ==========================================================================
    // TYPING INDICATORS
    // ==========================================================================

    socket.on('typing:start', (sessionId) => {
      socket.to(`session:${sessionId}`).emit('typing:started', {
        userId: user.id,
        userName: user.firstName,
      });
    });

    socket.on('typing:stop', (sessionId) => {
      socket.to(`session:${sessionId}`).emit('typing:stopped', {
        userId: user.id,
      });
    });

    // ==========================================================================
    // DISCONNECTION
    // ==========================================================================

    socket.on('disconnect', (reason) => {
      console.log(`✗ User disconnected: ${user.firstName} (${reason})`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${user.firstName}:`, error);
    });
  });

  // Log connection stats periodically
  setInterval(() => {
    const connectedSockets = io.sockets.sockets.size;
    if (connectedSockets > 0) {
      console.log(`  📊 Active connections: ${connectedSockets}`);
    }
  }, 60000); // Every minute
};
