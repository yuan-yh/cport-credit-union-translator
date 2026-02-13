// =============================================================================
// DATABASE MODULE
// SQLite with better-sqlite3 for synchronous, high-performance operations
// =============================================================================

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Database file path
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/cport.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database connection
const db = new Database(DB_PATH, { verbose: process.env.NODE_ENV === 'development' ? console.log : null });

// Enable foreign keys and WAL mode for better performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// =============================================================================
// SCHEMA INITIALIZATION - Run immediately to ensure tables exist
// =============================================================================

function initializeSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  db.exec(schema);
  console.log('✓ Database schema initialized');
}

// Initialize schema immediately on module load
initializeSchema();

// =============================================================================
// SEED DATA
// =============================================================================

async function seedDatabase() {
  // Check if admin user already exists
  const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('ADMIN');
  
  if (existingAdmin) {
    console.log('✓ Database already seeded');
    return;
  }

  console.log('Seeding database...');

  // Create default users
  const passwordHash = await bcrypt.hash('password123', 12);
  
  const users = [
    {
      id: uuidv4(),
      username: 'admin',
      email: 'admin@cportcu.org',
      password_hash: passwordHash,
      first_name: 'System',
      last_name: 'Administrator',
      role: 'ADMIN',
      branch_id: 'forest-avenue',
    },
    {
      id: uuidv4(),
      username: 'greeter1',
      email: 'sarah.wilson@cportcu.org',
      password_hash: passwordHash,
      first_name: 'Sarah',
      last_name: 'Wilson',
      role: 'GREETER',
      branch_id: 'forest-avenue',
    },
    {
      id: uuidv4(),
      username: 'teller1',
      email: 'mike.johnson@cportcu.org',
      password_hash: passwordHash,
      first_name: 'Mike',
      last_name: 'Johnson',
      role: 'TELLER',
      branch_id: 'forest-avenue',
    },
    {
      id: uuidv4(),
      username: 'consultor1',
      email: 'lisa.chen@cportcu.org',
      password_hash: passwordHash,
      first_name: 'Lisa',
      last_name: 'Chen',
      role: 'CONSULTOR',
      branch_id: 'forest-avenue',
    },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, branch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((users) => {
    for (const user of users) {
      insertUser.run(
        user.id,
        user.username,
        user.email,
        user.password_hash,
        user.first_name,
        user.last_name,
        user.role,
        user.branch_id
      );
    }
  });

  insertMany(users);
  console.log('✓ Database seeded with default users');
  console.log('  Default password for all users: password123');
}

// =============================================================================
// USER QUERIES - Now safe since schema is initialized above
// =============================================================================

const userQueries = {
  findByEmail: db.prepare(`
    SELECT id, username, email, password_hash, first_name, last_name, role, branch_id, is_active, created_at, updated_at
    FROM users WHERE email = ?
  `),
  
  findById: db.prepare(`
    SELECT id, username, email, first_name, last_name, role, branch_id, is_active, created_at, updated_at
    FROM users WHERE id = ?
  `),
  
  findAll: db.prepare(`
    SELECT id, username, email, first_name, last_name, role, branch_id, is_active, created_at, updated_at
    FROM users WHERE is_active = 1 ORDER BY created_at DESC
  `),
  
  create: db.prepare(`
    INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, branch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  update: db.prepare(`
    UPDATE users SET first_name = ?, last_name = ?, role = ?, branch_id = ? WHERE id = ?
  `),
};

// =============================================================================
// SESSION QUERIES
// =============================================================================

const sessionQueries = {
  create: db.prepare(`
    INSERT INTO sessions (id, customer_name, customer_phone, preferred_language, service_type, priority, branch_id, greeter_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  findById: db.prepare(`
    SELECT s.*, 
           g.first_name as greeter_first_name, g.last_name as greeter_last_name,
           b.first_name as banker_first_name, b.last_name as banker_last_name
    FROM sessions s
    LEFT JOIN users g ON s.greeter_id = g.id
    LEFT JOIN users b ON s.assigned_banker_id = b.id
    WHERE s.id = ?
  `),
  
  findActive: db.prepare(`
    SELECT s.*, 
           g.first_name as greeter_first_name, g.last_name as greeter_last_name,
           b.first_name as banker_first_name, b.last_name as banker_last_name
    FROM sessions s
    LEFT JOIN users g ON s.greeter_id = g.id
    LEFT JOIN users b ON s.assigned_banker_id = b.id
    WHERE s.status IN ('ACTIVE', 'WAITING', 'IN_SERVICE')
    AND s.branch_id = ?
    ORDER BY s.created_at DESC
  `),
  
  update: db.prepare(`
    UPDATE sessions SET 
      customer_name = COALESCE(?, customer_name),
      service_type = COALESCE(?, service_type),
      priority = COALESCE(?, priority),
      emotion_state = COALESCE(?, emotion_state),
      status = COALESCE(?, status),
      assigned_banker_id = COALESCE(?, assigned_banker_id)
    WHERE id = ?
  `),
  
  complete: db.prepare(`
    UPDATE sessions SET status = 'COMPLETED', completed_at = datetime('now') WHERE id = ?
  `),
};

// =============================================================================
// TRANSLATION QUERIES
// =============================================================================

const translationQueries = {
  create: db.prepare(`
    INSERT INTO translations (id, session_id, original_text, translated_text, source_language, target_language, confidence, context, speaker_type, processing_time_ms, created_by_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  findBySession: db.prepare(`
    SELECT * FROM translations WHERE session_id = ? ORDER BY created_at ASC
  `),
};

// =============================================================================
// QUEUE QUERIES
// =============================================================================

const queueQueries = {
  create: db.prepare(`
    INSERT INTO queue_items (id, session_id, queue_type, position, estimated_wait_minutes, priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  
  findById: db.prepare(`
    SELECT q.*, s.customer_name, s.preferred_language, s.service_type, s.emotion_state
    FROM queue_items q
    JOIN sessions s ON q.session_id = s.id
    WHERE q.id = ?
  `),
  
  findByType: db.prepare(`
    SELECT q.*, s.customer_name, s.preferred_language, s.service_type, s.emotion_state,
           b.first_name as banker_first_name, b.last_name as banker_last_name
    FROM queue_items q
    JOIN sessions s ON q.session_id = s.id
    LEFT JOIN users b ON q.assigned_banker_id = b.id
    WHERE q.queue_type = ? AND q.status IN ('WAITING', 'CALLED')
    ORDER BY 
      CASE q.priority 
        WHEN 'URGENT' THEN 1 
        WHEN 'HIGH' THEN 2 
        WHEN 'STANDARD' THEN 3 
        WHEN 'LOW' THEN 4 
      END,
      q.position ASC
  `),
  
  getStats: db.prepare(`
    SELECT 
      queue_type,
      COUNT(*) as count,
      AVG(estimated_wait_minutes) as avg_wait
    FROM queue_items
    WHERE status = 'WAITING'
    GROUP BY queue_type
  `),
  
  getNextPosition: db.prepare(`
    SELECT COALESCE(MAX(position), 0) + 1 as next_position
    FROM queue_items
    WHERE queue_type = ? AND status = 'WAITING'
  `),
  
  update: db.prepare(`
    UPDATE queue_items SET 
      status = COALESCE(?, status),
      assigned_banker_id = COALESCE(?, assigned_banker_id),
      called_at = CASE WHEN ? = 'CALLED' THEN datetime('now') ELSE called_at END,
      completed_at = CASE WHEN ? = 'COMPLETED' THEN datetime('now') ELSE completed_at END
    WHERE id = ?
  `),
};

// =============================================================================
// CHAT HISTORY QUERIES
// =============================================================================

const chatQueries = {
  create: db.prepare(`
    INSERT INTO chat_messages (id, session_id, translation_id, speaker_type, original_text, translated_text, source_language, target_language, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  findBySession: db.prepare(`
    SELECT * FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC
  `),
};

// =============================================================================
// REFRESH TOKEN QUERIES
// =============================================================================

const tokenQueries = {
  create: db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `),
  
  findByHash: db.prepare(`
    SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0
  `),
  
  revoke: db.prepare(`
    UPDATE refresh_tokens SET revoked = 1 WHERE id = ?
  `),
  
  revokeAllForUser: db.prepare(`
    UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?
  `),
  
  cleanup: db.prepare(`
    DELETE FROM refresh_tokens WHERE expires_at < datetime('now') OR revoked = 1
  `),
};

// =============================================================================
// AUDIT QUERIES
// =============================================================================

const auditQueries = {
  create: db.prepare(`
    INSERT INTO audit_logs (id, user_id, session_id, action, resource, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  db,
  initializeSchema,
  seedDatabase,
  queries: {
    users: userQueries,
    sessions: sessionQueries,
    translations: translationQueries,
    queue: queueQueries,
    chat: chatQueries,
    tokens: tokenQueries,
    audit: auditQueries,
  },
};
