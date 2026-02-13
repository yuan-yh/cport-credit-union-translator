// =============================================================================
// QUEUE ROUTES
// =============================================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queries } = require('../database');
const { ApiError } = require('../middleware/errorHandler');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// =============================================================================
// HELPERS
// =============================================================================

function formatQueueItem(dbItem) {
  return {
    id: dbItem.id,
    sessionId: dbItem.session_id,
    queueType: dbItem.queue_type,
    position: dbItem.position,
    estimatedWaitMinutes: dbItem.estimated_wait_minutes,
    priority: dbItem.priority,
    status: dbItem.status,
    assignedBankerId: dbItem.assigned_banker_id,
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at,
    calledAt: dbItem.called_at,
    completedAt: dbItem.completed_at,
    session: dbItem.customer_name !== undefined ? {
      id: dbItem.session_id,
      customerName: dbItem.customer_name,
      preferredLanguage: dbItem.preferred_language,
      serviceType: dbItem.service_type,
      emotionState: dbItem.emotion_state,
    } : undefined,
    assignedBanker: dbItem.banker_first_name ? {
      id: dbItem.assigned_banker_id,
      firstName: dbItem.banker_first_name,
      lastName: dbItem.banker_last_name,
    } : undefined,
  };
}

function calculateEstimatedWait(queueType, position) {
  // Average service times
  const avgTime = queueType === 'TELLER' ? 5 : 15;
  return avgTime * position;
}

// =============================================================================
// GET QUEUE STATS
// =============================================================================

router.get('/stats', (req, res, next) => {
  try {
    const stats = queries.queue.getStats.all();
    
    const result = {
      tellerQueue: {
        count: 0,
        estimatedWait: 0,
      },
      consultorQueue: {
        count: 0,
        estimatedWait: 0,
      },
    };

    for (const stat of stats) {
      if (stat.queue_type === 'TELLER') {
        result.tellerQueue.count = stat.count;
        result.tellerQueue.estimatedWait = Math.round(stat.avg_wait || 0);
      } else if (stat.queue_type === 'CONSULTOR') {
        result.consultorQueue.count = stat.count;
        result.consultorQueue.estimatedWait = Math.round(stat.avg_wait || 0);
      }
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET QUEUE ITEMS
// =============================================================================

router.get('/', (req, res, next) => {
  try {
    const queueType = req.query.type;
    
    let items;
    if (queueType) {
      items = queries.queue.findByType.all(queueType.toUpperCase());
    } else {
      // Get both queues
      const tellerItems = queries.queue.findByType.all('TELLER');
      const consultorItems = queries.queue.findByType.all('CONSULTOR');
      items = [...tellerItems, ...consultorItems];
    }

    res.json({
      success: true,
      data: items.map(formatQueueItem),
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// ADD TO QUEUE
// =============================================================================

router.post('/', requireRole('GREETER', 'TELLER', 'CONSULTOR'), (req, res, next) => {
  try {
    const { sessionId, queueType, priority } = req.body;

    // Validate required fields
    if (!sessionId || !queueType) {
      throw new ApiError(400, 'Session ID and queue type are required', 'VALIDATION_ERROR');
    }

    const validQueueTypes = ['TELLER', 'CONSULTOR'];
    if (!validQueueTypes.includes(queueType.toUpperCase())) {
      throw new ApiError(400, 'Invalid queue type', 'VALIDATION_ERROR');
    }

    // Check session exists
    const session = queries.sessions.findById.get(sessionId);
    if (!session) {
      throw new ApiError(404, 'Session not found', 'NOT_FOUND');
    }

    // Get next position
    const { next_position } = queries.queue.getNextPosition.get(queueType.toUpperCase());
    const estimatedWait = calculateEstimatedWait(queueType.toUpperCase(), next_position);

    // Create queue item
    const queueItemId = uuidv4();
    
    queries.queue.create.run(
      queueItemId,
      sessionId,
      queueType.toUpperCase(),
      next_position,
      estimatedWait,
      priority || 'STANDARD'
    );

    // Update session status
    queries.sessions.update.run(null, null, null, null, 'WAITING', null, sessionId);

    // Fetch created item
    const queueItem = queries.queue.findById.get(queueItemId);

    // Log audit
    queries.audit.create.run(
      uuidv4(),
      req.user.id,
      sessionId,
      'QUEUE_ADD',
      'queue',
      JSON.stringify({ queueType, position: next_position }),
      req.ip
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`branch:${session.branch_id}`).emit('queue:changed', {
        type: queueType.toUpperCase(),
        action: 'add',
        item: formatQueueItem(queueItem),
      });
    }

    res.status(201).json({
      success: true,
      data: formatQueueItem(queueItem),
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// UPDATE QUEUE ITEM
// =============================================================================

router.patch('/:id', requireRole('TELLER', 'CONSULTOR'), (req, res, next) => {
  try {
    const { status, assignedBankerId } = req.body;

    // Check queue item exists
    const existing = queries.queue.findById.get(req.params.id);
    if (!existing) {
      throw new ApiError(404, 'Queue item not found', 'NOT_FOUND');
    }

    // Update queue item
    queries.queue.update.run(
      status,
      assignedBankerId,
      status, // For called_at trigger
      status, // For completed_at trigger
      req.params.id
    );

    // If status is IN_SERVICE, update session status too
    if (status === 'IN_SERVICE' || status === 'CALLED') {
      queries.sessions.update.run(
        null, null, null, null, 
        status === 'IN_SERVICE' ? 'IN_SERVICE' : 'WAITING',
        assignedBankerId || req.user.id,
        existing.session_id
      );
    }

    // If completed, update session
    if (status === 'COMPLETED') {
      queries.sessions.complete.run(existing.session_id);
    }

    // Fetch updated item
    const queueItem = queries.queue.findById.get(req.params.id);

    // Log audit
    queries.audit.create.run(
      uuidv4(),
      req.user.id,
      existing.session_id,
      'QUEUE_UPDATE',
      'queue',
      JSON.stringify({ status, assignedBankerId }),
      req.ip
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      const session = queries.sessions.findById.get(existing.session_id);
      io.to(`branch:${session.branch_id}`).emit('queue:changed', {
        type: existing.queue_type,
        action: 'update',
        item: formatQueueItem(queueItem),
      });
      io.to(`session:${existing.session_id}`).emit('queue:item-updated', formatQueueItem(queueItem));
    }

    res.json({
      success: true,
      data: formatQueueItem(queueItem),
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// CALL NEXT IN QUEUE
// =============================================================================

router.post('/call-next', requireRole('TELLER', 'CONSULTOR'), (req, res, next) => {
  try {
    const { queueType } = req.body;

    if (!queueType) {
      throw new ApiError(400, 'Queue type is required', 'VALIDATION_ERROR');
    }

    // Get next waiting item
    const items = queries.queue.findByType.all(queueType.toUpperCase());
    const nextItem = items.find(item => item.status === 'WAITING');

    if (!nextItem) {
      return res.json({
        success: true,
        data: null,
        message: 'No customers waiting in queue',
      });
    }

    // Update to CALLED status and assign to current user
    queries.queue.update.run('CALLED', req.user.id, 'CALLED', null, nextItem.id);

    // Fetch updated item
    const queueItem = queries.queue.findById.get(nextItem.id);

    // Log audit
    queries.audit.create.run(
      uuidv4(),
      req.user.id,
      nextItem.session_id,
      'QUEUE_CALL',
      'queue',
      null,
      req.ip
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      const session = queries.sessions.findById.get(nextItem.session_id);
      io.to(`branch:${session.branch_id}`).emit('queue:changed', {
        type: queueType.toUpperCase(),
        action: 'call',
        item: formatQueueItem(queueItem),
      });
    }

    res.json({
      success: true,
      data: formatQueueItem(queueItem),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
