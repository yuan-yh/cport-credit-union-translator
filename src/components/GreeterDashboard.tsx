import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Customer } from '../types';
import Header from './common/Header';
import LanguageSelector from './greeter/LanguageSelector';
import TranslationPanel from './common/TranslationPanel';
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

    const handleStartTranslation = () => {
        console.log('Starting translation for language:', currentLanguage);
        setShowTranslation(true);
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
                                onStartTranslation={handleStartTranslation}
                            />
                        </div>

                        {/* Customer Information */}
                        <div className="lg:col-span-1">
                            <CustomerForm
                                customerData={customerData}
                                onCustomerDataChange={setCustomerData}
                                onSubmit={handleCustomerSubmit}
                                currentLanguage={currentLanguage}
                            />
                        </div>

                        {/* Queue Status */}
                        <div className="lg:col-span-1">
                            <QueueAssignment customers={state.customers} />
                        </div>
                    </div>

                    {/* Translation Panel - Full Screen Popup */}
                    {showTranslation && (
                        <TranslationPanel
                            sourceLanguage="en"
                            targetLanguage={currentLanguage}
                            onClose={() => setShowTranslation(false)}
                        />
                    )}

                    {/* Debug Info - Remove after testing */}
                    {/* {process.env.NODE_ENV === 'development' && (
                        <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs">
                            Language: {currentLanguage} | Show: {showTranslation.toString()}
                        </div>
                    )} */}
                </div>
            </div>
        </div>
    );
};

export default GreeterDashboard;