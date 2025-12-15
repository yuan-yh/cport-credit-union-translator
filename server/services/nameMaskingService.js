/**
 * Name Masking Service
 * Masks person names before translation and restores them after
 */

class NameMaskingService {
    /**
     * Mask names in text with placeholders GPT won't touch
     * Sort longest first to avoid partial overwrites
     */
    maskNames(text, entities) {
        if (!entities || entities.length === 0) {
            return { maskedText: text, mapping: {} };
        }

        let maskedText = text;
        const mapping = {};
        let index = 0;

        // Sort longest first to avoid partial overwrites
        const sortedEntities = [...entities].sort((a, b) => b.text.length - a.text.length);

        sortedEntities.forEach(ent => {
            const name = ent.text.trim();
            if (!name || name.length < 2) return;

            // Use a placeholder format that GPT won't translate
            const placeholder = `__PERSON_${index}__`;
            
            // Replace all occurrences of the name (case-insensitive for better matching)
            const regex = new RegExp(this.escapeRegex(name), 'gi');
            maskedText = maskedText.replace(regex, placeholder);
            
            mapping[placeholder] = name; // Store original name
            index++;
        });

        return { maskedText, mapping };
    }

    /**
     * Restore names after translation
     */
    unmaskNames(text, mapping) {
        if (!mapping || Object.keys(mapping).length === 0) {
            return text;
        }

        let restored = text;
        
        // Restore in reverse order to handle nested cases
        const placeholders = Object.keys(mapping).sort().reverse();
        
        placeholders.forEach(placeholder => {
            const name = mapping[placeholder];
            // Replace all occurrences
            const regex = new RegExp(this.escapeRegex(placeholder), 'g');
            restored = restored.replace(regex, name);
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
        const placeholderPattern = /__PERSON_\d+__/g;
        const remaining = text.match(placeholderPattern);
        
        if (remaining && remaining.length > 0) {
            console.warn(`⚠️ Warning: ${remaining.length} placeholder(s) not restored:`, remaining);
            return false;
        }
        
        return true;
    }
}

module.exports = new NameMaskingService();

