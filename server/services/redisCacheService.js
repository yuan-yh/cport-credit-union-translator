const crypto = require('crypto');

class RedisCacheService {
    constructor() {
        this.isEnabled = process.env.REDIS_CACHE_ENABLED === 'true';
        this.redis = null;
        this.isConnected = false;
        
        if (this.isEnabled) {
            this.initializeRedis();
        }
        
        console.log(`🚀 Redis Cache Service: ${this.isEnabled ? 'ENABLED' : 'DISABLED'}`);
    }

    async initializeRedis() {
        try {
            const redis = require('redis');
            this.redis = redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                socket: {
                    connectTimeout: 5000,
                    lazyConnect: true
                }
            });

            this.redis.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.redis.on('connect', () => {
                console.log('✅ Redis connected');
                this.isConnected = true;
            });

            this.redis.on('ready', () => {
                console.log('✅ Redis ready');
                this.isConnected = true;
            });

            this.redis.on('end', () => {
                console.log('❌ Redis disconnected');
                this.isConnected = false;
            });

            await this.redis.connect();
        } catch (error) {
            console.error('Failed to initialize Redis:', error.message);
            this.isEnabled = false;
        }
    }

    /**
     * Get cached translation
     */
    async getCachedTranslation(originalText, sourceLanguage, targetLanguage) {
        if (!this.isEnabled || !this.isConnected) {
            return null;
        }

        try {
            const key = this.generateCacheKey(originalText, sourceLanguage, targetLanguage);
            const cached = await this.redis.get(key);
            
            if (cached) {
                const data = JSON.parse(cached);
                console.log(`🎯 Redis cache hit: ${originalText.substring(0, 50)}...`);
                return {
                    success: true,
                    translatedText: data.translatedText,
                    sourceLanguage: data.sourceLanguage,
                    targetLanguage: data.targetLanguage,
                    timestamp: data.timestamp,
                    cacheHit: 'redis',
                    processingTime: 0 // Instant from cache
                };
            }
            
            return null;
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }

    /**
     * Cache translation
     */
    async cacheTranslation(originalText, translatedText, sourceLanguage, targetLanguage) {
        if (!this.isEnabled || !this.isConnected) {
            return false;
        }

        try {
            const key = this.generateCacheKey(originalText, sourceLanguage, targetLanguage);
            const data = {
                originalText,
                translatedText,
                sourceLanguage,
                targetLanguage,
                timestamp: Date.now()
            };

            // Cache for 24 hours
            await this.redis.setEx(key, 86400, JSON.stringify(data));
            console.log(`💾 Cached in Redis: ${originalText.substring(0, 50)}...`);
            return true;
        } catch (error) {
            console.error('Redis set error:', error);
            return false;
        }
    }

    /**
     * Generate TTS cache key using SHA-256 hash
     */
    generateTTSCacheKey(text, voice = 'default') {
        const normalizedText = text.trim();
        // Use SHA-256 hash to ensure unique keys and prevent collisions
        const hash = crypto.createHash('sha256')
            .update(`${normalizedText}:${voice}`)
            .digest('hex')
            .substring(0, 32); // Use first 32 chars of hex (128 bits, collision-resistant)
        return `tts:${voice}:${hash}`;
    }

    /**
     * Get cached TTS audio
     */
    async getCachedTTS(text, voice = 'default') {
        if (!this.isEnabled || !this.isConnected) {
            return null;
        }

        try {
            const key = this.generateTTSCacheKey(text, voice);
            const cached = await this.redis.get(key);
            
            if (cached) {
                console.log(`🎵 Redis TTS cache hit: ${text.substring(0, 30)}...`);
                return Buffer.from(cached, 'base64');
            }
            
            return null;
        } catch (error) {
            console.error('Redis TTS get error:', error);
            return null;
        }
    }

    /**
     * Cache TTS audio
     */
    async cacheTTS(text, audioBuffer, voice = 'default') {
        if (!this.isEnabled || !this.isConnected) {
            return false;
        }

        try {
            const key = this.generateTTSCacheKey(text, voice);
            const base64Audio = audioBuffer.toString('base64');
            
            // Cache for 7 days
            await this.redis.setEx(key, 604800, base64Audio);
            console.log(`🎵 Cached TTS in Redis: ${text.substring(0, 30)}...`);
            return true;
        } catch (error) {
            console.error('Redis TTS set error:', error);
            return false;
        }
    }

    /**
     * Generate cache key using SHA-256 hash to prevent collisions
     */
    generateCacheKey(originalText, sourceLanguage, targetLanguage) {
        const normalizedText = originalText.toLowerCase().trim();
        // Use SHA-256 hash to ensure unique keys and prevent collisions
        const hash = crypto.createHash('sha256')
            .update(`${normalizedText}:${sourceLanguage}:${targetLanguage}`)
            .digest('hex')
            .substring(0, 32); // Use first 32 chars of hex (128 bits, collision-resistant)
        return `translation:${sourceLanguage}:${targetLanguage}:${hash}`;
    }

    /**
     * Health check
     */
    async healthCheck() {
        if (!this.isEnabled) {
            return { success: false, error: 'Redis disabled' };
        }

        try {
            if (!this.isConnected) {
                return { success: false, error: 'Redis not connected' };
            }

            await this.redis.ping();
            return { success: true, service: 'redis-cache' };
        } catch (error) {
            return { success: false, error: error.message, service: 'redis-cache' };
        }
    }

    /**
     * Close connection
     */
    async close() {
        if (this.redis && this.isConnected) {
            await this.redis.quit();
            this.isConnected = false;
        }
    }
}

module.exports = RedisCacheService;
