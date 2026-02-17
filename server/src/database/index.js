// =============================================================================
// DATABASE MODULE - Supports SQLite (local) and PostgreSQL (Cloud SQL)
// =============================================================================

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Determine which database to use
let USE_POSTGRES = !!process.env.DATABASE_URL || !!process.env.DB_HOST;

let db;
let isPostgres = false;

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

if (USE_POSTGRES) {
  // PostgreSQL connection - require pg only when needed
  try {
    const { Pool } = require('pg');
    
    const poolConfig = process.env.DATABASE_URL 
      ? { connectionString: process.env.DATABASE_URL }
      : {
          host: process.env.DB_HOST || '/cloudsql/' + process.env.CLOUD_SQL_CONNECTION_NAME,
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME || 'cport',
          port: process.env.DB_PORT || 5432,
        };
    
    db = new Pool(poolConfig);
    isPostgres = true;
    console.log('✓ PostgreSQL connection pool initialized');
  } catch (err) {
    console.error('Failed to initialize PostgreSQL:', err.message);
    console.log('Falling back to SQLite...');
    USE_POSTGRES = false;
  }
}

if (!USE_POSTGRES || !db) {
  // SQLite connection (local development or fallback)
  const Database = require('better-sqlite3');
  const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/cport.db');
  
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  db = new Database(DB_PATH, { verbose: process.env.NODE_ENV === 'development' ? console.log : null });
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  isPostgres = false;
  console.log('✓ SQLite database connection initialized');
}

// =============================================================================
// QUERY HELPERS - Abstract differences between SQLite and PostgreSQL
// =============================================================================

/**
 * Execute a query and return all rows
 */
async function query(sql, params = []) {
  if (isPostgres) {
    const result = await db.query(convertToPostgresParams(sql), params);
    return result.rows;
  } else {
    // SQLite is synchronous, wrap in Promise
    return Promise.resolve(db.prepare(sql).all(...params));
  }
}

/**
 * Execute a query and return first row
 */
async function queryOne(sql, params = []) {
  if (isPostgres) {
    const result = await db.query(convertToPostgresParams(sql), params);
    return result.rows[0] || null;
  } else {
    // SQLite is synchronous, wrap in Promise
    return Promise.resolve(db.prepare(sql).get(...params) || null);
  }
}

/**
 * Execute a query (INSERT, UPDATE, DELETE)
 */
async function run(sql, params = []) {
  if (isPostgres) {
    const result = await db.query(convertToPostgresParams(sql), params);
    return { changes: result.rowCount };
  } else {
    // SQLite is synchronous, wrap in Promise
    return Promise.resolve(db.prepare(sql).run(...params));
  }
}

/**
 * Convert ? placeholders to $1, $2, etc. for PostgreSQL
 */
function convertToPostgresParams(sql) {
  let paramIndex = 0;
  return sql.replace(/\?/g, () => `$${++paramIndex}`);
}

/**
 * Convert datetime functions for cross-database compatibility
 */
function now() {
  return isPostgres ? 'NOW()' : "datetime('now')";
}

// =============================================================================
// SCHEMA INITIALIZATION
// =============================================================================

async function initializeSchema() {
  if (isPostgres) {
    // PostgreSQL schema
    const pgSchema = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'STAFF' CHECK (role IN ('STAFF', 'ADMIN')),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        customer_language VARCHAR(10) NOT NULL,
        customer_name VARCHAR(255),
        notes TEXT,
        status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED')),
        staff_id VARCHAR(36) NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS translations (
        id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(36) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        original_text TEXT NOT NULL,
        translated_text TEXT NOT NULL,
        source_language VARCHAR(10) NOT NULL,
        target_language VARCHAR(10) NOT NULL,
        speaker_type VARCHAR(20) DEFAULT 'customer' CHECK (speaker_type IN ('staff', 'customer')),
        confidence DECIMAL(5,4),
        processing_time_ms INTEGER,
        audio_url TEXT,
        staff_id VARCHAR(36) NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_staff ON sessions(staff_id);
      CREATE INDEX IF NOT EXISTS idx_translations_session ON translations(session_id);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
    `;
    
    await db.query(pgSchema);
    console.log('✓ PostgreSQL schema initialized');
  } else {
    // SQLite schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('✓ SQLite schema initialized');
  }
}

// =============================================================================
// SEED DATA
// =============================================================================

async function seedDatabase() {
  // Check if admin user already exists
  const existingAdmin = await queryOne('SELECT id FROM users WHERE username = ?', ['admin']);
  
  if (existingAdmin) {
    console.log('✓ Database already seeded');
    return;
  }

  console.log('Seeding database...');
  const passwordHash = await bcrypt.hash('admin123', 12);
  const staffPasswordHash = await bcrypt.hash('staff123', 12);
  
  // Create admin user
  await run(
    `INSERT INTO users (id, username, email, password_hash, first_name, last_name, role)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'admin', 'admin@cportcu.org', passwordHash, 'Admin', 'User', 'ADMIN']
  );

  // Create staff user
  await run(
    `INSERT INTO users (id, username, email, password_hash, first_name, last_name, role)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'staff', 'staff@cportcu.org', staffPasswordHash, 'Staff', 'Member', 'STAFF']
  );

  console.log('✓ Database seeded');
  console.log('  Admin: admin / admin123');
  console.log('  Staff: staff / staff123');
}

// =============================================================================
// QUERY OBJECTS (for backwards compatibility with existing code)
// =============================================================================

const queries = {
  users: {
    findByEmail: {
      get: async (email) => queryOne('SELECT * FROM users WHERE email = ?', [email]),
    },
    findByUsername: {
      get: async (username) => queryOne('SELECT * FROM users WHERE username = ?', [username]),
    },
    findById: {
      get: async (id) => queryOne(
        'SELECT id, username, email, first_name, last_name, role, is_active, created_at FROM users WHERE id = ?',
        [id]
      ),
    },
    findAll: {
      all: async () => query(
        'SELECT id, username, email, first_name, last_name, role, is_active, created_at FROM users WHERE is_active = true ORDER BY created_at DESC'
      ),
    },
    create: {
      run: async (...params) => run(
        `INSERT INTO users (id, username, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?, 'ADMIN')`,
        params
      ),
    },
  },
  
  sessions: {
    create: {
      run: async (...params) => run(
        `INSERT INTO sessions (id, customer_language, customer_name, notes, staff_id) VALUES (?, ?, ?, ?, ?)`,
        params
      ),
    },
    findById: {
      get: async (id) => queryOne(
        `SELECT s.*, u.first_name as staff_first_name, u.last_name as staff_last_name
         FROM sessions s JOIN users u ON s.staff_id = u.id WHERE s.id = ?`,
        [id]
      ),
    },
    findAll: {
      all: async () => query(
        `SELECT s.*, u.first_name as staff_first_name, u.last_name as staff_last_name,
                (SELECT COUNT(*) FROM translations WHERE session_id = s.id) as translation_count
         FROM sessions s JOIN users u ON s.staff_id = u.id ORDER BY s.created_at DESC LIMIT 100`
      ),
    },
    findByStaff: {
      all: async (staffId) => query(
        `SELECT s.*, (SELECT COUNT(*) FROM translations WHERE session_id = s.id) as translation_count
         FROM sessions s WHERE s.staff_id = ? ORDER BY s.created_at DESC`,
        [staffId]
      ),
    },
    complete: {
      run: async (id) => run(
        isPostgres 
          ? `UPDATE sessions SET status = 'COMPLETED', completed_at = NOW() WHERE id = ?`
          : `UPDATE sessions SET status = 'COMPLETED', completed_at = datetime('now') WHERE id = ?`,
        [id]
      ),
    },
  },
  
  translations: {
    create: {
      run: async (...params) => run(
        `INSERT INTO translations (id, session_id, original_text, translated_text, source_language, target_language, speaker_type, confidence, processing_time_ms, audio_url, staff_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      ),
    },
    findBySession: {
      all: async (sessionId) => query(
        `SELECT t.*, u.first_name as staff_first_name, u.last_name as staff_last_name
         FROM translations t JOIN users u ON t.staff_id = u.id WHERE t.session_id = ? ORDER BY t.created_at ASC`,
        [sessionId]
      ),
    },
    findAll: {
      all: async () => query(
        `SELECT t.*, s.customer_language, s.customer_name, u.first_name as staff_first_name, u.last_name as staff_last_name
         FROM translations t JOIN sessions s ON t.session_id = s.id JOIN users u ON t.staff_id = u.id ORDER BY t.created_at DESC LIMIT 500`
      ),
    },
    findRecent: {
      all: async (limit) => query(
        `SELECT t.*, s.customer_language, s.customer_name, u.first_name as staff_first_name, u.last_name as staff_last_name
         FROM translations t JOIN sessions s ON t.session_id = s.id JOIN users u ON t.staff_id = u.id ORDER BY t.created_at DESC LIMIT ?`,
        [limit]
      ),
    },
    updateAudioUrl: {
      run: async (audioUrl, id) => run(`UPDATE translations SET audio_url = ? WHERE id = ?`, [audioUrl, id]),
    },
  },
  
  tokens: {
    create: {
      run: async (...params) => run(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`,
        params
      ),
    },
    findByHash: {
      get: async (hash) => queryOne(
        `SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = false`,
        [hash]
      ),
    },
    revoke: {
      run: async (id) => run(`UPDATE refresh_tokens SET revoked = true WHERE id = ?`, [id]),
    },
    revokeAllForUser: {
      run: async (userId) => run(`UPDATE refresh_tokens SET revoked = true WHERE user_id = ?`, [userId]),
    },
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  db,
  query,
  queryOne,
  run,
  initializeSchema,
  seedDatabase,
  queries,
  isPostgres,
};
