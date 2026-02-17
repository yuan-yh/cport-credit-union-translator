-- =============================================================================
-- CPORT CREDIT UNION TRANSLATION TOOL - SIMPLIFIED DATABASE SCHEMA
-- =============================================================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- =============================================================================
-- USERS TABLE (Staff with login)
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('STAFF', 'ADMIN')),
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for common lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- =============================================================================
-- SESSIONS TABLE (Translation sessions)
-- =============================================================================

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    customer_language TEXT NOT NULL CHECK (customer_language IN ('en', 'pt', 'fr', 'so', 'ar', 'es', 'ln')),
    customer_name TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED')),
    staff_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
);

-- Indexes for session queries
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_staff ON sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);

-- =============================================================================
-- TRANSLATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS translations (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    source_language TEXT NOT NULL CHECK (source_language IN ('en', 'pt', 'fr', 'so', 'ar', 'es', 'ln')),
    target_language TEXT NOT NULL CHECK (target_language IN ('en', 'pt', 'fr', 'so', 'ar', 'es', 'ln')),
    speaker_type TEXT NOT NULL CHECK (speaker_type IN ('customer', 'staff')),
    confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    processing_time_ms INTEGER NOT NULL,
    audio_url TEXT,  -- Google Cloud Storage URL for original audio
    created_at TEXT DEFAULT (datetime('now')),
    staff_id TEXT NOT NULL REFERENCES users(id)
);

-- Indexes for translation queries
CREATE INDEX IF NOT EXISTS idx_translations_session ON translations(session_id);
CREATE INDEX IF NOT EXISTS idx_translations_staff ON translations(staff_id);
CREATE INDEX IF NOT EXISTS idx_translations_created ON translations(created_at);

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
