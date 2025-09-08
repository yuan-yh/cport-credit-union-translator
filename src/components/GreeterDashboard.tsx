import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Customer } from '../types';
import Header from './common/Header';
import LanguageSelector from './greeter/LanguageSelector';
import VoiceTranslationPanel from './common/VoiceTranslationPanel';
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Center</h2>
                        <p className="text-gray-600">Help customers get started and route them to the right service</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Language Selection */}
                        <div className="lg:col-span-1">
                            <LanguageSelector
                                selectedLanguage={currentLanguage}
                                onLanguageChange={setCurrentLanguage}
                                onStartTranslation={() => setShowTranslation(true)}
                            />
                        </div>

                        {/* Customer Information */}
                        <div className="lg:col-span-1">
                            <CustomerForm
                                customerData={customerData}
                                onCustomerDataChange={setCustomerData}
                                onSubmit={handleCustomerSubmit}
                            />
                        </div>

                        {/* Queue Status */}
                        <div className="lg:col-span-1">
                            <QueueAssignment customers={state.customers} />
                        </div>
                    </div>

                    {/* Translation Modal */}
                    {showTranslation && (
                        <VoiceTranslationPanel
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