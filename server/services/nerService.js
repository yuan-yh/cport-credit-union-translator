// Use dynamic import for ES module
let transformersModule = null;

class NERService {
    constructor() {
        this.nerPipeline = null;
        this.isLoading = false;
        this.loadPromise = null;
    }

    /**
     * Load transformers module dynamically (ES module)
     */
    async loadTransformers() {
        if (transformersModule) {
            return transformersModule;
        }
        
        try {
            transformersModule = await import('@xenova/transformers');
            return transformersModule;
        } catch (error) {
            console.error('❌ Failed to load transformers module:', error);
            throw error;
        }
    }

    /**
     * Load NER pipeline once at startup (not per request)
     */
    async loadNER() {
        if (this.nerPipeline) {
            return; // Already loaded
        }

        if (this.isLoading) {
            // If already loading, wait for the existing promise
            return this.loadPromise;
        }

        this.isLoading = true;
        this.loadPromise = (async () => {
            try {
                console.log('🔍 Loading NER model for name detection...');
                const startTime = Date.now();
                
                // Load transformers module
                const { pipeline } = await this.loadTransformers();
                
                // Load NER pipeline
                this.nerPipeline = await pipeline(
                    'token-classification',
                    'Xenova/bert-base-multilingual-cased-ner-hrl'
                );
                
                const loadTime = Date.now() - startTime;
                console.log(`✅ NER model loaded in ${loadTime}ms`);
            } catch (error) {
                console.error('❌ Failed to load NER model:', error);
                this.nerPipeline = null;
                // Don't throw - allow translation to continue without NER
            } finally {
                this.isLoading = false;
            }
        })();

        return this.loadPromise;
    }

    /**
     * Detect person entities in text
     */
    async detectPersons(text) {
        if (!this.nerPipeline) {
            await this.loadNER();
        }

        if (!this.nerPipeline) {
            console.warn('⚠️ NER not available, skipping name detection');
            return [];
        }

        try {
            const startTime = Date.now();
            const entities = await this.nerPipeline(text);
            const processingTime = Date.now() - startTime;

            const persons = entities
                .filter(e => e.entity_group === 'PER')
                .map(e => ({
                    text: e.word.replace(/^##/, ''),
                    start: e.start,
                    end: e.end,
                    score: e.score
                }));

            if (persons.length > 0) {
                console.log(`👤 Detected ${persons.length} person name(s) in ${processingTime}ms`);
            }

            return persons;
        } catch (error) {
            console.error('Error detecting persons:', error);
            return [];
        }
    }

    /**
     * Detect single names using context patterns (fallback for NER misses)
     */
    detectSingleNames(text) {
        const patterns = [
            // Pattern 1: After "my name is", "I'm", etc. - improved to catch full names
            /(?:send money to|pay|transfer to|my name is|I'm|I am|call me|this is|je m'appelle|me llamo|meu nome é)\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ]+)*)/gi,
            // Pattern 2: After "account holder", "customer name", etc.
            /(?:account holder|customer name|client name|name:|nom:|nome:)\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ]+)*)/gi,
            // Pattern 3: After titles
            /(?:Mr\.|Mrs\.|Ms\.|Dr\.|M\.|Mme\.|Mlle\.)\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ]+)*)/gi,
            // Pattern 4: Standalone capitalized words that look like names (2-3 words, each capitalized)
            /\b([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ]+){1,2})\b/g
        ];

        const matches = [];
        const seenNames = new Set();
        
        patterns.forEach((regex, patternIndex) => {
            let match;
            // Reset regex lastIndex for each pattern
            regex.lastIndex = 0;
            while ((match = regex.exec(text)) !== null) {
                const name = match[1].trim();
                // Only add if it looks like a name (capitalized, reasonable length)
                // For pattern 4 (standalone), be more strict
                if (patternIndex === 3) {
                    // Standalone pattern: must be 2-3 words, each word 2+ chars, not common words
                    const words = name.split(/\s+/);
                    const commonWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']);
                    if (words.length >= 2 && words.length <= 3 && 
                        words.every(w => w.length >= 2 && !commonWords.has(w.toLowerCase()))) {
                        const nameKey = name.toLowerCase();
                        if (!seenNames.has(nameKey)) {
                            seenNames.add(nameKey);
                            matches.push({ text: name });
                        }
                    }
                } else {
                    // Context-based patterns: more lenient
                    if (name.length >= 2 && name.length <= 50 && /^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ]/.test(name)) {
                        const nameKey = name.toLowerCase();
                        if (!seenNames.has(nameKey)) {
                            seenNames.add(nameKey);
                            matches.push({ text: name });
                        }
                    }
                }
            }
        });

        return matches;
    }

    /**
     * Combine NER results with regex fallback
     */
    async detectAllNames(text) {
        const [nerPersons, regexPersons] = await Promise.all([
            this.detectPersons(text),
            Promise.resolve(this.detectSingleNames(text))
        ]);

        // Merge results, avoiding duplicates
        const allPersons = [...nerPersons];
        const nerTexts = new Set(nerPersons.map(p => p.text.toLowerCase()));

        regexPersons.forEach(regexPerson => {
            if (!nerTexts.has(regexPerson.text.toLowerCase())) {
                allPersons.push(regexPerson);
            }
        });

        return allPersons;
    }

    /**
     * Detect banking entities: account numbers, routing numbers, amounts, dates
     */
    detectBankingEntities(text) {
        const entities = [];

        // Account numbers: 8-17 digits, often with context like "account", "acct", "checking", "savings"
        const accountPatterns = [
            /(?:account|acct|checking|savings)\s*(?:number|#|num)?\s*:?\s*(\d{8,17})/gi,
            /(\d{8,17})\s*(?:account|acct)/gi
        ];

        // Routing numbers: exactly 9 digits, often with context
        const routingPatterns = [
            /(?:routing|routing number|ABA|RTN)\s*(?:number|#|num)?\s*:?\s*(\d{9})/gi,
            /(\d{9})\s*(?:routing|ABA|RTN)/gi
        ];

        // Amounts: currency symbols with numbers, or "dollars", "cents"
        const amountPatterns = [
            /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,  // $500, $1,234.56
            /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|USD|usd)/gi,
            /(\d+)\s*(?:cents?|¢)/gi
        ];

        // Dates: common date formats
        const datePatterns = [
            /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g,  // MM/DD/YYYY, DD-MM-YY, etc.
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})/gi
        ];

        // SSN: 9 digits in XXX-XX-XXXX format
        const ssnPatterns = [
            /\b(\d{3}-\d{2}-\d{4})\b/g,
            /(?:SSN|social security)\s*(?:number|#)?\s*:?\s*(\d{3}-?\d{2}-?\d{4})/gi
        ];

        // Extract account numbers
        accountPatterns.forEach(regex => {
            let match;
            while ((match = regex.exec(text)) !== null) {
                entities.push({
                    type: 'ACCOUNT_NUMBER',
                    text: match[1],
                    start: match.index,
                    end: match.index + match[0].length
                });
            }
        });

        // Extract routing numbers
        routingPatterns.forEach(regex => {
            let match;
            while ((match = regex.exec(text)) !== null) {
                entities.push({
                    type: 'ROUTING_NUMBER',
                    text: match[1],
                    start: match.index,
                    end: match.index + match[0].length
                });
            }
        });

        // Extract amounts
        amountPatterns.forEach(regex => {
            let match;
            while ((match = regex.exec(text)) !== null) {
                const amount = match[1] || match[0];
                // Only capture if it's a reasonable amount (not part of account number)
                if (amount.length <= 15) {
                    entities.push({
                        type: 'AMOUNT',
                        text: match[0], // Include currency symbol if present
                        start: match.index,
                        end: match.index + match[0].length
                    });
                }
            }
        });

        // Extract dates
        datePatterns.forEach(regex => {
            let match;
            while ((match = regex.exec(text)) !== null) {
                entities.push({
                    type: 'DATE',
                    text: match[0],
                    start: match.index,
                    end: match.index + match[0].length
                });
            }
        });

        // Extract SSNs
        ssnPatterns.forEach(regex => {
            let match;
            while ((match = regex.exec(text)) !== null) {
                entities.push({
                    type: 'SSN',
                    text: match[1] || match[0],
                    start: match.index,
                    end: match.index + match[0].length
                });
            }
        });

        // Remove duplicates (same text at same position)
        const uniqueEntities = [];
        const seen = new Set();
        entities.forEach(ent => {
            const key = `${ent.type}:${ent.text}:${ent.start}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueEntities.push(ent);
            }
        });

        return uniqueEntities;
    }

    /**
     * Detect all entities (names + banking entities)
     */
    async detectAllEntities(text) {
        const [names, bankingEntities] = await Promise.all([
            this.detectAllNames(text),
            Promise.resolve(this.detectBankingEntities(text))
        ]);

        return {
            names: names,
            banking: bankingEntities,
            all: [...names.map(n => ({ ...n, type: 'PERSON' })), ...bankingEntities]
        };
    }
}

module.exports = new NERService();

