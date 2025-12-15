/**
 * Entity Masking Service
 * Masks all sensitive entities (names, account numbers, amounts, etc.) before translation
 */

class EntityMaskingService {
    /**
     * Mask all entities in text with placeholders GPT won't touch
     * Handles both names and banking entities
     */
    maskEntities(text, entities) {
        if (!entities || entities.length === 0) {
            return { maskedText: text, mapping: {} };
        }

        let maskedText = text;
        const mapping = {};
        let index = 0;

        // Sort longest first to avoid partial overwrites
        const sortedEntities = [...entities].sort((a, b) => {
            const aText = a.text || '';
            const bText = b.text || '';
            return bText.length - aText.length;
        });

        sortedEntities.forEach(ent => {
            const entityText = (ent.text || '').trim();
            if (!entityText || entityText.length < 1) return;

            // Determine placeholder type based on entity type
            const entityType = ent.type || 'PERSON';
            let placeholderPrefix;
            
            switch (entityType) {
                case 'PERSON':
                    placeholderPrefix = '__PERSON_';
                    break;
                case 'ACCOUNT_NUMBER':
                    placeholderPrefix = '__ACCOUNT_';
                    break;
                case 'ROUTING_NUMBER':
                    placeholderPrefix = '__ROUTING_';
                    break;
                case 'AMOUNT':
                    placeholderPrefix = '__AMOUNT_';
                    break;
                case 'DATE':
                    placeholderPrefix = '__DATE_';
                    break;
                case 'SSN':
                    placeholderPrefix = '__SSN_';
                    break;
                default:
                    placeholderPrefix = '__ENTITY_';
            }

            const placeholder = `${placeholderPrefix}${index}__`;
            
            // Replace all occurrences (case-insensitive for names, exact for numbers)
            if (entityType === 'PERSON') {
                const regex = new RegExp(this.escapeRegex(entityText), 'gi');
                maskedText = maskedText.replace(regex, placeholder);
            } else {
                // For banking entities, use exact match to preserve formatting
                const regex = new RegExp(this.escapeRegex(entityText), 'g');
                maskedText = maskedText.replace(regex, placeholder);
            }
            
            mapping[placeholder] = entityText; // Store original entity
            index++;
        });

        return { maskedText, mapping };
    }

    /**
     * Restore entities after translation
     */
    unmaskEntities(text, mapping) {
        if (!mapping || Object.keys(mapping).length === 0) {
            return text;
        }

        let restored = text;
        
        // Restore in reverse order to handle nested cases
        const placeholders = Object.keys(mapping).sort().reverse();
        
        placeholders.forEach(placeholder => {
            const entity = mapping[placeholder];
            // Replace all occurrences
            const regex = new RegExp(this.escapeRegex(placeholder), 'g');
            restored = restored.replace(regex, entity);
        });

        return restored;
    }

    /**
     * Escape special regex characters
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Validate that no placeholders remain in final text (safety check)
     */
    validateUnmasking(text) {
        const placeholderPattern = /__(?:PERSON|ACCOUNT|ROUTING|AMOUNT|DATE|SSN|ENTITY)_\d+__/g;
        const remaining = text.match(placeholderPattern);
        
        if (remaining && remaining.length > 0) {
            console.warn(`⚠️ Warning: ${remaining.length} placeholder(s) not restored:`, remaining);
            return false;
        }
        
        return true;
    }
}

module.exports = new EntityMaskingService();

