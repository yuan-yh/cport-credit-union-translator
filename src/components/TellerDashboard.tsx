import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from './common/Header';
import TranslationPanel from './common/TranslationPanel';

const TellerDashboard: React.FC = () => {
    const { state, dispatch } = useApp();
    const [currentCustomer, setCurrentCustomer] = useState<string | null>(null);
    const [showTranslation, setShowTranslation] = useState(false);

    const simpleQueueCustomers = state.customers.filter(
        c => c.serviceType === 'simple' && c.status === 'waiting'
    );

    const handleServeNext = () => {
        if (simpleQueueCustomers.length > 0) {
            const nextCustomer = simpleQueueCustomers[0];
            setCurrentCustomer(nextCustomer.id);
            dispatch({
                type: 'UPDATE_CUSTOMER',
                payload: {
                    id: nextCustomer.id,
                    updates: { status: 'in-service', assignedTo: state.currentUser?.name }
                }
            });
        }
    };

    const handleCompleteService = () => {
        if (currentCustomer) {
            dispatch({
                type: 'UPDATE_CUSTOMER',
                payload: {
                    id: currentCustomer,
                    updates: { status: 'completed' }
                }
            });
            setCurrentCustomer(null);
            setShowTranslation(false);
        }
    };

    const activeCustomer = state.customers.find(c => c.id === currentCustomer);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Teller Window</h2>
                        <p className="text-gray-600">Serve customers with simple transactions</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Queue Management */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">
                                Customer Queue ({simpleQueueCustomers.length} waiting)
                            </h3>

                            {!currentCustomer ? (
                                <div>
                                    {simpleQueueCustomers.length > 0 ? (
                                        <div className="space-y-3">
                                            {simpleQueueCustomers.slice(0, 3).map((customer, index) => (
                                                <div key={customer.id} className={`p-3 rounded border ${index === 0 ? 'border-cport-blue bg-blue-50' : 'border-gray-200'
                                                    }`}>
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium">{customer.name || 'Customer'}</p>
                                                            <p className="text-sm text-gray-600">
                                                                Language: {customer.language.toUpperCase()}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Wait: {customer.estimatedWaitTime} min
                                                            </p>
                                                        </div>
                                                        {index === 0 && (
                                                            <span className="text-xs bg-cport-blue text-white px-2 py-1 rounded">
                                                                NEXT
                                                            </span>
                                                        )}
                                                    </div>
                                                    {customer.notes && (
                                                        <p className="text-sm text-gray-600 mt-2 italic">{customer.notes}</p>
                                                    )}
                                                </div>
                                            ))}

                                            <button
                                                onClick={handleServeNext}
                                                className="w-full bg-cport-blue text-white py-3 rounded-md hover:bg-cport-light transition-colors font-medium"
                                            >
                                                Serve Next Customer
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500 mb-4">No customers in queue</p>
                                            <div className="text-6xl mb-4">💤</div>
                                            <p className="text-sm text-gray-400">Waiting for customers...</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-cport-blue text-white p-4 rounded-md">
                                        <h4 className="font-semibold">Now Serving</h4>
                                        <p className="text-blue-100">{activeCustomer?.name || 'Customer'}</p>
                                        <p className="text-blue-200 text-sm">
                                            Language: {activeCustomer?.language.toUpperCase()}
                                        </p>
                                    </div>

                                    {activeCustomer?.notes && (
                                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                                            <p className="text-sm text-yellow-800">
                                                <strong>Notes:</strong> {activeCustomer.notes}
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setShowTranslation(!showTranslation)}
                                            className="w-full bg-cport-green text-white py-2 rounded-md hover:bg-green-600 transition-colors"
                                        >
                                            {showTranslation ? 'Hide Translation' : 'Start Translation'}
                                        </button>

                                        <button
                                            onClick={handleCompleteService}
                                            className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 transition-colors"
                                        >
                                            Complete Service
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Banking Work Area Simulation */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">Banking System</h3>

                            <div className="bg-gray-100 p-4 rounded-md mb-4">
                                <p className="text-sm text-gray-600 mb-2">Simulated Banking Interface</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white p-2 rounded">Account: ****1234</div>
                                    <div className="bg-white p-2 rounded">Balance: $1,247.56</div>
                                    <div className="bg-white p-2 rounded">Type: Checking</div>
                                    <div className="bg-white p-2 rounded">Status: Active</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <button className="w-full bg-green-500 text-white py-2 rounded text-sm hover:bg-green-600">
                                    Process Deposit
                                </button>
                                <button className="w-full bg-blue-500 text-white py-2 rounded text-sm hover:bg-blue-600">
                                    Process Withdrawal
                                </button>
                                <button className="w-full bg-purple-500 text-white py-2 rounded text-sm hover:bg-purple-600">
                                    Account Inquiry
                                </button>
                                <button className="w-full bg-orange-500 text-white py-2 rounded text-sm hover:bg-orange-600">
                                    Print Statement
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Translation Modal */}
                    {showTranslation && activeCustomer && (
                        <TranslationPanel
                            sourceLanguage="en"
                            targetLanguage={activeCustomer.language}
                            onClose={() => setShowTranslation(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default TellerDashboard;