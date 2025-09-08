const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

class ConversationCache {
    constructor() {
        this.dbPath = path.join(__dirname, '..', 'data', 'conversations.db');
        this.db = null;
        this.initialized = false;
        
        // Cache configuration
        this.maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
        this.maxCacheSize = 1000; // Maximum cached conversations
        this.similarityThreshold = 0.8; // Similarity threshold for cache hits
        
        this._initializeDatabase();
    }

    async _initializeDatabase() {
        return new Promise((resolve, reject) => {
            // Ensure data directory exists
            const fs = require('fs');
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening conversation database:', err);
                    reject(err);
                    return;
                }
                
                this._createTables().then(() => {
                    this.initialized = true;
                    console.log('✅ Conversation cache database initialized');
                    resolve();
                }).catch(reject);
            });
        });
    }

    async _createTables() {
        return new Promise((resolve, reject) => {
            const createTablesSQL = `
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hash TEXT UNIQUE NOT NULL,
                    original_text TEXT NOT NULL,
                    translated_text TEXT NOT NULL,
                    source_language TEXT NOT NULL,
                    target_language TEXT NOT NULL,
                    emotional_context TEXT,
                    customer_mood TEXT,
                    extracted_name TEXT,
                    extracted_phone TEXT,
                    visit_reason TEXT,
                    notes TEXT,
                    audio_duration REAL,
                    processing_time INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
                    use_count INTEGER DEFAULT 1,
                    is_greeting BOOLEAN DEFAULT 0,
                    is_common_phrase BOOLEAN DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS greeting_patterns (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pattern TEXT UNIQUE NOT NULL,
                    response TEXT NOT NULL,
                    language TEXT NOT NULL,
                    context TEXT,
                    use_count INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_used DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS common_phrases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    phrase_hash TEXT UNIQUE NOT NULL,
                    original_phrase TEXT NOT NULL,
                    translated_phrase TEXT NOT NULL,
                    source_language TEXT NOT NULL,
                    target_language TEXT NOT NULL,
                    category TEXT,
                    use_count INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_used DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_conversations_hash ON conversations(hash);
                CREATE INDEX IF NOT EXISTS idx_conversations_languages ON conversations(source_language, target_language);
                CREATE INDEX IF NOT EXISTS idx_conversations_greeting ON conversations(is_greeting);
                CREATE INDEX IF NOT EXISTS idx_conversations_common ON conversations(is_common_phrase);
                CREATE INDEX IF NOT EXISTS idx_greeting_patterns_language ON greeting_patterns(language);
                CREATE INDEX IF NOT EXISTS idx_common_phrases_languages ON common_phrases(source_language, target_language);
            `;

            this.db.exec(createTablesSQL, (err) => {
                if (err) {
                    console.error('Error creating conversation cache tables:', err);
                    reject(err);
                    return;
                }
                
                this._seedGreetingPatterns().then(resolve).catch(reject);
            });
        });
    }

    async _seedGreetingPatterns() {
        const greetingPatterns = [
            // English greetings
            { pattern: 'hello', response: 'Hello! How can I help you today?', language: 'en', context: 'greeting' },
            { pattern: 'good morning', response: 'Good morning! Welcome to our credit union. How may I assist you?', language: 'en', context: 'greeting' },
            { pattern: 'good afternoon', response: 'Good afternoon! Welcome to our credit union. How may I assist you?', language: 'en', context: 'greeting' },
            { pattern: 'hi there', response: 'Hi there! How can I help you today?', language: 'en', context: 'greeting' },
            { pattern: 'how are you', response: 'I\'m doing well, thank you! How can I help you today?', language: 'en', context: 'greeting' },
            
            // Spanish greetings
            { pattern: 'hola', response: '¡Hola! ¿Cómo puedo ayudarle hoy?', language: 'es', context: 'greeting' },
            { pattern: 'buenos días', response: '¡Buenos días! Bienvenido a nuestra cooperativa de crédito. ¿En qué puedo ayudarle?', language: 'es', context: 'greeting' },
            { pattern: 'buenas tardes', response: '¡Buenas tardes! Bienvenido a nuestra cooperativa de crédito. ¿En qué puedo ayudarle?', language: 'es', context: 'greeting' },
            { pattern: '¿cómo está?', response: 'Estoy muy bien, ¡gracias! ¿En qué puedo ayudarle hoy?', language: 'es', context: 'greeting' },
            
            // Portuguese greetings
            { pattern: 'olá', response: 'Olá! Como posso ajudá-lo hoje?', language: 'pt', context: 'greeting' },
            { pattern: 'bom dia', response: 'Bom dia! Bem-vindo à nossa cooperativa de crédito. Como posso ajudá-lo?', language: 'pt', context: 'greeting' },
            { pattern: 'boa tarde', response: 'Boa tarde! Bem-vindo à nossa cooperativa de crédito. Como posso ajudá-lo?', language: 'pt', context: 'greeting' },
            
            // French greetings
            { pattern: 'bonjour', response: 'Bonjour! Comment puis-je vous aider aujourd\'hui?', language: 'fr', context: 'greeting' },
            { pattern: 'bonsoir', response: 'Bonsoir! Bienvenue à notre coopérative de crédit. Comment puis-je vous aider?', language: 'fr', context: 'greeting' },
            
            // Arabic greetings
            { pattern: 'السلام عليكم', response: 'وعليكم السلام! كيف يمكنني مساعدتك اليوم؟', language: 'ar', context: 'greeting' },
            { pattern: 'صباح الخير', response: 'صباح الخير! أهلاً وسهلاً في تعاونيتنا الائتمانية. كيف يمكنني مساعدتك؟', language: 'ar', context: 'greeting' },
            
            // Somali greetings
            { pattern: 'salaan', response: 'Salaan! Sidee baan ku caawin karaa maanta?', language: 'so', context: 'greeting' },
            { pattern: 'subax wanaagsan', response: 'Subax wanaagsan! Ku soo dhawoow bangigeena. Sidee baan ku caawin karaa?', language: 'so', context: 'greeting' }
        ];

        for (const greeting of greetingPatterns) {
            await this._insertGreetingPattern(greeting);
        }
    }

    async _insertGreetingPattern(greeting) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT OR IGNORE INTO greeting_patterns (pattern, response, language, context)
                VALUES (?, ?, ?, ?)
            `;
            
            this.db.run(sql, [greeting.pattern, greeting.response, greeting.language, greeting.context], (err) => {
                if (err) {
                    console.warn('Error inserting greeting pattern:', err);
                }
                resolve();
            });
        });
    }

    _generateHash(text, sourceLanguage, targetLanguage) {
        const normalizedText = text.toLowerCase().trim();
        return crypto.createHash('md5').update(`${normalizedText}-${sourceLanguage}-${targetLanguage}`).digest('hex');
    }

    _calculateSimilarity(text1, text2) {
        const words1 = text1.toLowerCase().split(/\s+/);
        const words2 = text2.toLowerCase().split(/\s+/);
        
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }

    async findCachedTranslation(originalText, sourceLanguage, targetLanguage) {
        if (!this.initialized) {
            await this._initializeDatabase();
        }

        return new Promise(async (resolve, reject) => {
            try {
                const hash = this._generateHash(originalText, sourceLanguage, targetLanguage);
                
                // First, try exact hash match
                const exactMatchSQL = `
                    SELECT * FROM conversations 
                    WHERE hash = ? AND source_language = ? AND target_language = ?
                    ORDER BY last_used DESC LIMIT 1
                `;
                
                this.db.get(exactMatchSQL, [hash, sourceLanguage, targetLanguage], async (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (row) {
                        // Update usage statistics
                        await this._updateUsageStats(row.id);
                        resolve({
                            cached: true,
                            translatedText: row.translated_text,
                            emotionalContext: row.emotional_context,
                            customerMood: row.customer_mood,
                            extractedName: row.extracted_name,
                            extractedPhone: row.extracted_phone,
                            visitReason: row.visit_reason,
                            notes: row.notes,
                            processingTime: 0, // Cached response is instant
                            cacheHit: 'exact'
                        });
                        return;
                    }
                    
                    // Check for greeting patterns
                    const greetingResponse = await this._getGreetingResponse(originalText, sourceLanguage);
                    if (greetingResponse) {
                        resolve({
                            cached: true,
                            translatedText: greetingResponse,
                            emotionalContext: 'friendly',
                            customerMood: 'positive',
                            processingTime: 0,
                            cacheHit: 'greeting'
                        });
                        return;
                    }
                    
                    // Try similarity match for common phrases
                    const similarResult = await this._findSimilarTranslation(originalText, sourceLanguage, targetLanguage);
                    resolve(similarResult);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async _findSimilarTranslation(originalText, sourceLanguage, targetLanguage) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM conversations 
                WHERE source_language = ? AND target_language = ?
                AND (is_greeting = 1 OR is_common_phrase = 1)
                ORDER BY last_used DESC LIMIT 50
            `;
            
            this.db.all(sql, [sourceLanguage, targetLanguage], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                for (const row of rows) {
                    const similarity = this._calculateSimilarity(originalText, row.original_text);
                    if (similarity >= this.similarityThreshold) {
                        // Update usage statistics
                        this._updateUsageStats(row.id);
                        resolve({
                            cached: true,
                            translatedText: row.translated_text,
                            emotionalContext: row.emotional_context,
                            customerMood: row.customer_mood,
                            extractedName: row.extracted_name,
                            extractedPhone: row.extracted_phone,
                            visitReason: row.visit_reason,
                            notes: row.notes,
                            processingTime: 0,
                            cacheHit: 'similar',
                            similarity: similarity
                        });
                        return;
                    }
                }
                
                resolve(null); // No similar translation found
            });
        });
    }

    async cacheTranslation(translationData) {
        if (!this.initialized) {
            await this._initializeDatabase();
        }

        const {
            originalText,
            translatedText,
            sourceLanguage,
            targetLanguage,
            emotionalContext,
            customerMood,
            extractedName,
            extractedPhone,
            visitReason,
            notes,
            audioDuration,
            processingTime
        } = translationData;

        const hash = this._generateHash(originalText, sourceLanguage, targetLanguage);
        
        // Check if it's a greeting
        const isGreeting = await this._isGreeting(originalText, sourceLanguage);
        
        // Check if it's a common phrase
        const isCommonPhrase = await this._isCommonPhrase(originalText, sourceLanguage);

        return new Promise((resolve, reject) => {
            const sql = `
                INSERT OR REPLACE INTO conversations (
                    hash, original_text, translated_text, source_language, target_language,
                    emotional_context, customer_mood, extracted_name, extracted_phone,
                    visit_reason, notes, audio_duration, processing_time,
                    is_greeting, is_common_phrase, last_used, use_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 
                    COALESCE((SELECT use_count FROM conversations WHERE hash = ?), 0) + 1)
            `;
            
            this.db.run(sql, [
                hash, originalText, translatedText, sourceLanguage, targetLanguage,
                emotionalContext, customerMood, extractedName, extractedPhone,
                visitReason, notes, audioDuration, processingTime,
                isGreeting, isCommonPhrase, hash
            ], (err) => {
                if (err) {
                    console.error('Error caching translation:', err);
                    reject(err);
                    return;
                }
                
                console.log(`✅ Cached translation: ${originalText.substring(0, 50)}...`);
                resolve();
            });
        });
    }

    async _isGreeting(text, language) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT COUNT(*) as count FROM greeting_patterns 
                WHERE language = ? AND ? LIKE '%' || pattern || '%'
            `;
            
            this.db.get(sql, [language, text.toLowerCase()], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row.count > 0);
            });
        });
    }

    async _getGreetingResponse(text, language) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT response FROM greeting_patterns 
                WHERE language = ? AND ? LIKE '%' || pattern || '%'
                ORDER BY LENGTH(pattern) DESC LIMIT 1
            `;
            
            this.db.get(sql, [language, text.toLowerCase()], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row ? row.response : null);
            });
        });
    }

    async _isCommonPhrase(text, language) {
        // Simple heuristics for common phrases
        const commonPatterns = [
            'thank you', 'thanks', 'please', 'excuse me', 'sorry',
            'yes', 'no', 'okay', 'ok', 'sure', 'of course',
            'how much', 'what time', 'where is', 'can you help',
            'i need', 'i want', 'i would like', 'i have a question'
        ];
        
        const lowerText = text.toLowerCase();
        return commonPatterns.some(pattern => lowerText.includes(pattern));
    }

    async _updateUsageStats(conversationId) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE conversations 
                SET last_used = CURRENT_TIMESTAMP, use_count = use_count + 1
                WHERE id = ?
            `;
            
            this.db.run(sql, [conversationId], (err) => {
                if (err) {
                    console.warn('Error updating usage stats:', err);
                }
                resolve();
            });
        });
    }

    async getCacheStats() {
        if (!this.initialized) {
            await this._initializeDatabase();
        }

        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    COUNT(*) as total_conversations,
                    COUNT(CASE WHEN is_greeting = 1 THEN 1 END) as greetings,
                    COUNT(CASE WHEN is_common_phrase = 1 THEN 1 END) as common_phrases,
                    AVG(processing_time) as avg_processing_time,
                    SUM(use_count) as total_uses
                FROM conversations
            `;
            
            this.db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
    }

    async cleanupOldCache() {
        if (!this.initialized) {
            return;
        }

        return new Promise((resolve, reject) => {
            const sql = `
                DELETE FROM conversations 
                WHERE last_used < datetime('now', '-${this.maxCacheAge / 1000} seconds')
                AND use_count < 2
            `;
            
            this.db.run(sql, [], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log(`🧹 Cleaned up ${this.changes} old cache entries`);
                resolve();
            });
        });
    }

    async close() {
        if (this.db) {
            return new Promise((resolve) => {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing conversation cache database:', err);
                    } else {
                        console.log('✅ Conversation cache database closed');
                    }
                    resolve();
                });
            });
        }
    }
}

module.exports = ConversationCache;
