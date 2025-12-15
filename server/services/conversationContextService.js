/**
 * Conversation Context Service
 * Manages conversation history and context for better translation quality
 */

class ConversationContextService {
    constructor() {
        // In-memory storage (in production, use Redis or similar)
        this.conversations = new Map();
        this.maxTurns = 5; // Keep last 5 turns
    }

    /**
     * Add a turn to conversation history
     */
    addTurn(sessionId, speaker, text, entities = []) {
        if (!this.conversations.has(sessionId)) {
            this.conversations.set(sessionId, {
                turns: [],
                activeEntities: {},
                currentIntent: null,
                bankingContext: {
                    accountNumbers: [],
                    amounts: [],
                    dates: [],
                    routingNumbers: []
                }
            });
        }

        const conversation = this.conversations.get(sessionId);
        
        // Add new turn
        conversation.turns.push({
            speaker, // 'customer' or 'staff'
            text,
            entities,
            timestamp: Date.now()
        });

        // Keep only last N turns
        if (conversation.turns.length > this.maxTurns) {
            conversation.turns.shift();
        }

        // Update active entities from this turn
        entities.forEach(ent => {
            if (ent.type === 'ACCOUNT_NUMBER') {
                if (!conversation.bankingContext.accountNumbers.includes(ent.text)) {
                    conversation.bankingContext.accountNumbers.push(ent.text);
                }
            } else if (ent.type === 'ROUTING_NUMBER') {
                if (!conversation.bankingContext.routingNumbers.includes(ent.text)) {
                    conversation.bankingContext.routingNumbers.push(ent.text);
                }
            } else if (ent.type === 'AMOUNT') {
                if (!conversation.bankingContext.amounts.includes(ent.text)) {
                    conversation.bankingContext.amounts.push(ent.text);
                }
            } else if (ent.type === 'DATE') {
                if (!conversation.bankingContext.dates.includes(ent.text)) {
                    conversation.bankingContext.dates.push(ent.text);
                }
            }
        });

        return conversation;
    }

    /**
     * Get conversation context for GPT prompt
     */
    getContext(sessionId) {
        const conversation = this.conversations.get(sessionId);
        if (!conversation || conversation.turns.length === 0) {
            return null;
        }

        // Build context summary
        const recentTurns = conversation.turns.slice(-this.maxTurns);
        const contextSummary = recentTurns.map(turn => 
            `${turn.speaker}: ${turn.text}`
        ).join('\n');

        return {
            history: contextSummary,
            activeEntities: conversation.activeEntities,
            bankingContext: conversation.bankingContext,
            recentTurns: recentTurns.length
        };
    }

    /**
     * Format context for GPT system prompt
     */
    formatContextForPrompt(sessionId, sourceLanguage, targetLanguage) {
        const context = this.getContext(sessionId);
        if (!context) {
            return '';
        }

        let prompt = `\n\nCONVERSATION CONTEXT (last ${context.recentTurns} turns):\n`;
        prompt += context.history;
        
        if (Object.keys(context.bankingContext).some(key => context.bankingContext[key].length > 0)) {
            prompt += `\n\nMENTIONED BANKING INFORMATION:\n`;
            if (context.bankingContext.accountNumbers.length > 0) {
                prompt += `- Account numbers mentioned: ${context.bankingContext.accountNumbers.join(', ')}\n`;
            }
            if (context.bankingContext.amounts.length > 0) {
                prompt += `- Amounts mentioned: ${context.bankingContext.amounts.join(', ')}\n`;
            }
            if (context.bankingContext.dates.length > 0) {
                prompt += `- Dates mentioned: ${context.bankingContext.dates.join(', ')}\n`;
            }
        }

        prompt += `\n\nIMPORTANT: When translating, maintain consistency with the conversation context above. `;
        prompt += `If the user refers to "that account", "the amount", or "the transaction", use the context to understand what they mean. `;
        prompt += `Keep banking terminology consistent throughout the conversation.`;

        return prompt;
    }

    /**
     * Clear conversation history (for new sessions)
     */
    clearSession(sessionId) {
        this.conversations.delete(sessionId);
    }

    /**
     * Clean up old conversations (call periodically)
     */
    cleanup(maxAge = 3600000) { // 1 hour default
        const now = Date.now();
        for (const [sessionId, conversation] of this.conversations.entries()) {
            const lastTurn = conversation.turns[conversation.turns.length - 1];
            if (lastTurn && (now - lastTurn.timestamp) > maxAge) {
                this.conversations.delete(sessionId);
            }
        }
    }
}

module.exports = new ConversationContextService();

