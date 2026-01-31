import { useMemo } from 'react';
import type { UIPreference } from '../components/UISelectionScreen';

export function useUIPreference(): UIPreference {
    return useMemo(() => {
        const stored = localStorage.getItem('uiPreference');
        return (stored === 'standard' || stored === 'red-button') ? stored : 'standard';
    }, []);
}

export function getUIPreference(): UIPreference {
    const stored = localStorage.getItem('uiPreference');
    return (stored === 'standard' || stored === 'red-button') ? stored : 'standard';
}

