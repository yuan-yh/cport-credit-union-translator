import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from './common/Header';
import TranslationPanel from './common/TranslationPanel';

const ConsultorDashboard: React.FC = () => {
    const { state, dispatch } = useApp();
    const [currentCustomer, setCurrentCustomer] = useState<string | null>(null);
    const [showTranslation, setShowTranslation] = useState(false);
    const [serviceProgress, setServiceProgress] = useState(0);

    const complexQueueCustomers = state.customers.filter(
        c => c.serviceType === 'complex' && c.status === 'waiting'
    );

    const serviceSteps = [
        'Customer greeting and needs assessment',
        'Document collection and verification',
        'Product explanation and options',
        'Application processing',
        'Final approval and completion'
    ];

    const handleServeNext = () => {
        if (complexQueueCustomers.length > 0) {
            const nextCustomer = complexQueueCustomers[0];
            setCurrentCustomer(nextCustomer.id);
            setServiceProgress(0);
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
            setServiceProgress(0);
        }
    };

    const activeCustomer = state.customers.find(c => c.id === currentCustomer);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Private Consultation</h2>
                        <p className="text-gray-600">Complex services: loans, new accounts, financial planning</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Queue Management */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">
                                Consultation Queue ({complexQueueCustomers.length})
                            </h3>

                            {!currentCustomer ? (
                                <div>
                                    {complexQueueCustomers.length > 0 ? (
                                        <div className="space-y-3">
                                            {complexQueueCustomers.map((customer, index) => (
                                                <div key={customer.id} className={`p-3 rounded border ${index === 0 ? 'border-cport-green bg-green-50' : 'border-gray-200'
                                                    }`}>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium">{customer.name || 'Customer'}</p>
                                                            <p className="text-sm text-gray-600">
                                                                {customer.language.toUpperCase()}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Est: {customer.estimatedWaitTime} min
                                                            </p>
                                                        </div>
                                                        {index === 0 && (
                                                            <span className="text-xs bg-cport-green text-white px-2 py-1 rounded">
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
                                                className="w-full bg-cport-green text-white py-3 rounded-md hover:bg-green-600 transition-colors font-medium"
                                            >
                                                Begin Consultation
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500 mb-4">No consultations scheduled</p>
                                            <div className="text-6xl mb-4">📋</div>
                                            <p className="text-sm text-gray-400">Ready for complex services</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-cport-green text-white p-4 rounded-md">
                                        <h4 className="font-semibold">In Consultation</h4>
                                        <p className="text-green-100">{activeCustomer?.name || 'Customer'}</p>
                                        <p className="text-green-200 text-sm">
                                            Language: {activeCustomer?.language.toUpperCase()}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setShowTranslation(!showTranslation)}
                                            className="w-full bg-cport-blue text-white py-2 rounded-md hover:bg-cport-light transition-colors"
                                        >
                                            {showTranslation ? 'Hide Translation' : 'Open Translation'}
                                        </button>

                                        <button
                                            onClick={handleCompleteService}
                                            className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 transition-colors"
                                        >
                                            Complete Consultation
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Service Progress */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">Service Progress</h3>

                            {currentCustomer ? (
                                <div className="space-y-4">
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Progress</span>
                                            <span>{Math.round((serviceProgress / (serviceSteps.length - 1)) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-cport-green h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${(serviceProgress / (serviceSteps.length - 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {serviceSteps.map((step, index) => (
                                            <div key={index} className={`p-2 rounded text-sm ${index < serviceProgress ? 'bg-green-100 text-green-800' :
                                                    index === serviceProgress ? 'bg-blue-100 text-blue-800 font-medium' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                <div className="flex items-center">
                                                    <div className={`w-4 h-4 rounded-full mr-2 ${index < serviceProgress ? 'bg-green-500' :
                                                            index === serviceProgress ? 'bg-blue-500' :
                                                                'bg-gray-400'
                                                        }`}></div>
                                                    {step}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setServiceProgress(Math.max(0, serviceProgress - 1))}
                                            disabled={serviceProgress === 0}
                                            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded text-sm hover:bg-gray-400 disabled:opacity-50"
                                        >
                                            Previous Step
                                        </button>
                                        <button
                                            onClick={() => setServiceProgress(Math.min(serviceSteps.length - 1, serviceProgress + 1))}
                                            disabled={serviceProgress === serviceSteps.length - 1}
                                            className="flex-1 bg-cport-blue text-white py-2 rounded text-sm hover:bg-cport-light disabled:opacity-50"
                                        >
                                            Next Step
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No active consultation</p>
                                </div>
                            )}
                        </div>

                        {/* Document Tools */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">Document Tools</h3>

                            <div className="space-y-3">
                                <div className="p-3 border rounded-md">
                                    <h4 className="font-medium text-sm mb-2">Loan Calculator</h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span>Amount:</span>
                                            <input type="number" placeholder="$25,000" className="w-20 px-1 border rounded" />
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Rate:</span>
                                            <input type="number" placeholder="5.5%" className="w-20 px-1 border rounded" />
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Term:</span>
                                            <input type="number" placeholder="60 mo" className="w-20 px-1 border rounded" />
                                        </div>
                                        <button className="w-full bg-blue-500 text-white py-1 rounded text-xs">
                                            Calculate
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3 border rounded-md">
                                    <h4 className="font-medium text-sm mb-2">Document Upload</h4>
                                    <div className="space-y-2">
                                        <input type="file" className="text-xs" />
                                        <button className="w-full bg-green-500 text-white py-1 rounded text-xs">
                                            Translate Document
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3 border rounded-md">
                                    <h4 className="font-medium text-sm mb-2">Quick Phrases</h4>
                                    <div className="space-y-1">
                                        <button className="w-full bg-gray-200 text-gray-700 py-1 rounded text-xs">
                                            "Let me explain this form..."
                                        </button>
                                        <button className="w-full bg-gray-200 text-gray-700 py-1 rounded text-xs">
                                            "What is your monthly income?"
                                        </button>
                                        <button className="w-full bg-gray-200 text-gray-700 py-1 rounded text-xs">
                                            "This is the interest rate..."
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Translation Panel */}
                    {showTranslation && activeCustomer && (
                        <div className="mt-6">
                            <TranslationPanel
                                sourceLanguage="en"
                                targetLanguage={activeCustomer.language}
                                onClose={() => setShowTranslation(false)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConsultorDashboard;