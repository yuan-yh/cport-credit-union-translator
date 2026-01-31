import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useUIPreference } from '../hooks/useUIPreference';
import type { Customer } from '../types';
import Header from './common/Header';
import LanguageSelector from './greeter/LanguageSelector';
import StreamingVoiceTranslationPanel from './common/StreamingVoiceTranslationPanel';
import CustomerForm from './greeter/CustomerForm';
import QueueAssignment from './greeter/QueueAssignment';
import RedButtonUI from './RedButtonUI';

const GreeterDashboard: React.FC = () => {
    const { state, dispatch } = useApp();
    const uiPreference = useUIPreference();
    const [currentLanguage, setCurrentLanguage] = useState('en');
    const [showTranslation, setShowTranslation] = useState(false);
    const [customerData, setCustomerData] = useState<Partial<Customer>>({});

    // Render Red Button UI if selected
    if (uiPreference === 'red-button') {
        return <RedButtonUI />;
    }

    const handleCustomerSubmit = (customer: Partial<Customer>) => {
        const newCustomer: Customer = {
            id: `customer_${Date.now()}`,
            name: customer.name || '',
            phone: customer.phone || '',
            language: currentLanguage,
            serviceType: customer.serviceType || 'simple',
            estimatedWaitTime: customer.serviceType === 'simple' ? 5 : 15,
            notes: customer.notes || '',
            mood: customer.mood || 'calm',
            status: 'waiting'
        };
        dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
        setCustomerData({});
        setShowTranslation(false);
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#000000',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Header />

            <div style={{ 
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: '24px',
                backgroundColor: '#000000'
            }}>
                <div style={{ 
                    maxWidth: '1400px', 
                    width: '100%'
                }}>
                    <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                        <h2 style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            marginBottom: '8px'
                        }}>
                            Welcome Center - Real-time Interpreter
                        </h2>
                        <p style={{ color: '#999999', fontSize: '16px', margin: 0 }}>
                            Help customers get started with instant voice translation and route them to the right service
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '24px',
                        justifyContent: 'center'
                    }}>
                        <LanguageSelector
                            selectedLanguage={currentLanguage}
                            onLanguageChange={setCurrentLanguage}
                            onStartTranslation={() => setShowTranslation(true)}
                        />

                        <CustomerForm
                            customerData={customerData}
                            onCustomerDataChange={setCustomerData}
                            onSubmit={handleCustomerSubmit}
                        />

                        <QueueAssignment customers={state.customers} />
                    </div>

                    {showTranslation && (
                        <StreamingVoiceTranslationPanel
                            targetLanguage={currentLanguage}
                            onClose={() => setShowTranslation(false)}
                            onCustomerDataUpdate={(data) => {
                                setCustomerData(prev => ({ ...prev, ...data }));
                            }}
                            currentCustomerData={customerData}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default GreeterDashboard;