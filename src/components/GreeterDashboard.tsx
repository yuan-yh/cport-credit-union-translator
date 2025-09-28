import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Customer } from '../types';
import Header from './common/Header';
import LanguageSelector from './greeter/LanguageSelector';
import StreamingVoiceTranslationPanel from './common/StreamingVoiceTranslationPanel';
import CustomerForm from './greeter/CustomerForm';
import QueueAssignment from './greeter/QueueAssignment';

const GreeterDashboard: React.FC = () => {
    const { state, dispatch } = useApp();
    const [currentLanguage, setCurrentLanguage] = useState('en');
    const [showTranslation, setShowTranslation] = useState(false);
    const [customerData, setCustomerData] = useState<Partial<Customer>>({});

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

    const startInterpreterSession = () => {
        setShowTranslation(true);
    };

    const addToQueue = () => {
        if (customerData.name) {
            handleCustomerSubmit(customerData);
        } else {
            alert('Please enter customer information first');
        }
    };

    return (
        <div className="welcome-page">
            <div className="welcome-header">
                <div className="header-content">
                    <div className="brand">
                        <div className="brand-icon">cP</div>
                        <div className="brand-text">
                            <h1>cPort Credit Union</h1>
                            <p>Real-time Interpreter Center</p>
                        </div>
                    </div>
                    <div className="user-info">
                        <div className="user-avatar">JD</div>
                        <button className="sign-out-btn" onClick={() => window.location.href = '/'}>Sign Out</button>
                    </div>
                </div>
            </div>

            <div className="welcome-content">
                <div className="hero-section">
                    <h1 className="hero-title">Professional Interpreter Services</h1>
                    <p className="hero-description">
                        Connect instantly with certified interpreters to provide seamless banking services 
                        to customers in their preferred language. Select a language and start helping customers today.
                    </p>
                </div>

                <div className="main-grid">
                    <div className="language-panel">
                        <h2 className="panel-title">
                            <div className="panel-icon">🌍</div>
                            Select Customer Language
                        </h2>
                        
                        <LanguageSelector
                            selectedLanguage={currentLanguage}
                            onLanguageChange={setCurrentLanguage}
                            onStartTranslation={startInterpreterSession}
                        />

                        <div className="action-section">
                            <button className="action-btn btn-primary" onClick={startInterpreterSession}>
                                🎧 Start Live Session
                            </button>
                            <button className="action-btn btn-secondary" onClick={addToQueue}>
                                📋 Add to Queue
                            </button>
                        </div>
                    </div>

                    <div className="customer-panel">
                        <CustomerForm
                            customerData={customerData}
                            onCustomerDataChange={setCustomerData}
                            onSubmit={handleCustomerSubmit}
                        />
                    </div>
                </div>

                <div className="status-grid">
                    <div className="status-card">
                        <div className="status-header">
                            <span className="status-title">Teller Queue</span>
                            <span style={{color: '#10b981'}}>●</span>
                        </div>
                        <div className="status-value">{state.customers.filter(c => c.status === 'waiting').length}</div>
                        <div className="status-description">Available immediately</div>
                    </div>
                    <div className="status-card">
                        <div className="status-header">
                            <span className="status-title">Private Consultation</span>
                            <span style={{color: '#10b981'}}>●</span>
                        </div>
                        <div className="status-value">{state.customers.filter(c => c.status === 'in-service').length}</div>
                        <div className="status-description">Available immediately</div>
                    </div>
                </div>
            </div>

            {/* Real-time Interpreter Modal */}
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
    );
};

export default GreeterDashboard;