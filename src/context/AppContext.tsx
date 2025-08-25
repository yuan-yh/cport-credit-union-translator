import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Customer, Session, User } from '../types';

interface AppState {
    currentUser: User | null;
    customers: Customer[];
    sessions: Session[];
    activeSession: Session | null;
}

type AppAction =
    | { type: 'SET_USER'; payload: User }
    | { type: 'ADD_CUSTOMER'; payload: Customer }
    | { type: 'UPDATE_CUSTOMER'; payload: { id: string; updates: Partial<Customer> } }
    | { type: 'START_SESSION'; payload: Session }
    | { type: 'UPDATE_SESSION'; payload: { id: string; updates: Partial<Session> } };

const initialState: AppState = {
    currentUser: null,
    customers: [],
    sessions: [],
    activeSession: null
};

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, currentUser: action.payload };
        case 'ADD_CUSTOMER':
            return { ...state, customers: [...state.customers, action.payload] };
        case 'UPDATE_CUSTOMER':
            return {
                ...state,
                customers: state.customers.map(c =>
                    c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
                )
            };
        case 'START_SESSION':
            return { ...state, sessions: [...state.sessions, action.payload], activeSession: action.payload };
        case 'UPDATE_SESSION':
            return {
                ...state,
                sessions: state.sessions.map(s =>
                    s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
                ),
                activeSession: state.activeSession?.id === action.payload.id
                    ? { ...state.activeSession, ...action.payload.updates }
                    : state.activeSession
            };
        default:
            return state;
    }
}

const AppContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}