export interface Customer {
    id: string;
    name?: string;
    phone?: string;
    language: string;
    serviceType: 'simple' | 'complex';
    estimatedWaitTime: number;
    notes?: string;
    mood?: 'calm' | 'anxious' | 'urgent';
    assignedTo?: string;
    status: 'waiting' | 'in-service' | 'completed';
}

export interface Translation {
    id: string;
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    confidence: number;
    timestamp: Date;
}

export interface Session {
    id: string;
    customerId: string;
    translations: Translation[];
    startTime: Date;
    endTime?: Date;
    staff: string;
    summary?: string;
}

export type UserRole = 'greeter' | 'teller' | 'consultor' | 'admin';

export interface User {
    id: string;
    name: string;
    role: UserRole;
}