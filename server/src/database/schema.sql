-- =============================================================================
-- CPORT CREDIT UNION TRANSLATION TOOL - DATABASE SCHEMA
-- SQLite with full-text search support
-- =============================================================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- =============================================================================
-- USERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('GREETER', 'TELLER', 'CONSULTOR', 'MANAGER', 'ADMIN')),
    branch_id TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for common lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);

-- =============================================================================
-- SESSIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    customer_name TEXT,
    customer_phone TEXT,
    preferred_language TEXT NOT NULL CHECK (preferred_language IN ('en', 'pt', 'fr', 'so', 'ar', 'es')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WAITING', 'IN_SERVICE', 'COMPLETED', 'ABANDONED')),
    service_type TEXT CHECK (service_type IN ('SIMPLE_TRANSACTION', 'COMPLEX_SERVICE', 'URGENT')),
    priority TEXT NOT NULL DEFAULT 'STANDARD' CHECK (priority IN ('LOW', 'STANDARD', 'HIGH', 'URGENT')),
    emotion_state TEXT CHECK (emotion_state IN ('CALM', 'NEUTRAL', 'ANXIOUS', 'DISTRESSED')),
    branch_id TEXT NOT NULL,
    greeter_id TEXT REFERENCES users(id),
    assigned_banker_id TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
);

-- Indexes for session queries
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_branch ON sessions(branch_id);
CREATE INDEX IF NOT EXISTS idx_sessions_greeter ON sessions(greeter_id);
CREATE INDEX IF NOT EXISTS idx_sessions_banker ON sessions(assigned_banker_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);

-- =============================================================================
-- TRANSLATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS translations (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    source_language TEXT NOT NULL CHECK (source_language IN ('en', 'pt', 'fr', 'so', 'ar', 'es')),
    target_language TEXT NOT NULL CHECK (target_language IN ('en', 'pt', 'fr', 'so', 'ar', 'es')),
    confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    context TEXT,
    speaker_type TEXT NOT NULL CHECK (speaker_type IN ('customer', 'staff')),
    processing_time_ms INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    created_by_id TEXT NOT NULL REFERENCES users(id)
);

-- Indexes for translation queries
CREATE INDEX IF NOT EXISTS idx_translations_session ON translations(session_id);
CREATE INDEX IF NOT EXISTS idx_translations_created ON translations(created_at);

-- =============================================================================
-- QUEUE ITEMS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS queue_items (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
    queue_type TEXT NOT NULL CHECK (queue_type IN ('TELLER', 'CONSULTOR')),
    position INTEGER NOT NULL,
    estimated_wait_minutes INTEGER NOT NULL,
    priority TEXT NOT NULL DEFAULT 'STANDARD' CHECK (priority IN ('LOW', 'STANDARD', 'HIGH', 'URGENT')),
    status TEXT NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'NO_SHOW')),
    assigned_banker_id TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    called_at TEXT,
    completed_at TEXT
);

-- Indexes for queue queries
CREATE INDEX IF NOT EXISTS idx_queue_type_status ON queue_items(queue_type, status);
CREATE INDEX IF NOT EXISTS idx_queue_position ON queue_items(position);

-- =============================================================================
-- CHAT HISTORY TABLE
-- Stores complete chat history for sessions
-- =============================================================================

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    translation_id TEXT REFERENCES translations(id) ON DELETE SET NULL,
    speaker_type TEXT NOT NULL CHECK (speaker_type IN ('customer', 'staff', 'system')),
    original_text TEXT NOT NULL,
    translated_text TEXT,
    source_language TEXT NOT NULL,
    target_language TEXT,
    confidence REAL,
    timestamp TEXT DEFAULT (datetime('now'))
);

-- Index for chat history retrieval
CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON chat_messages(timestamp);

-- =============================================================================
-- AUDIT LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    session_id TEXT REFERENCES sessions(id),
    action TEXT NOT NULL,
    resource TEXT,
    details TEXT, -- JSON string
    ip_address TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- =============================================================================
-- REFRESH TOKENS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    revoked INTEGER DEFAULT 0
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER IF NOT EXISTS update_users_timestamp
    AFTER UPDATE ON users
    FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_sessions_timestamp
    AFTER UPDATE ON sessions
    FOR EACH ROW
BEGIN
    UPDATE sessions SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_queue_items_timestamp
    AFTER UPDATE ON queue_items
    FOR EACH ROW
BEGIN
    UPDATE queue_items SET updated_at = datetime('now') WHERE id = OLD.id;
END;
