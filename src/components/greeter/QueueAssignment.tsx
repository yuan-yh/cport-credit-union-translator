import React from 'react';
import type { Customer } from '../../types';

interface QueueAssignmentProps {
    customers: Customer[];
}

const QueueAssignment: React.FC<QueueAssignmentProps> = ({ customers }) => {
    const waitingCustomers = customers.filter(c => c.status === 'waiting');
    const simpleQueue = waitingCustomers.filter(c => c.serviceType === 'simple');
    const complexQueue = waitingCustomers.filter(c => c.serviceType === 'complex');

    const getMoodColor = (mood: string) => {
        switch (mood) {
            case 'urgent': return 'text-red-500';
            case 'anxious': return 'text-yellow-500';
            default: return 'text-green-500';
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Queue Status</h3>

            <div className="space-y-4">
                <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                        Teller Line ({simpleQueue.length})
                    </h4>
                    <div className="space-y-2">
                        {simpleQueue.length === 0 ? (
                            <p className="text-sm text-gray-500">No customers waiting</p>
                        ) : (
                            simpleQueue.map((customer) => (
                                <div key={customer.id} className="bg-gray-50 p-3 rounded border-l-4 border-cport-blue">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium">{customer.name || 'Customer'}</p>
                                            <p className="text-sm text-gray-600">{customer.language.toUpperCase()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-medium ${getMoodColor(customer.mood || 'calm')}`}>
                                                {customer.mood}
                                            </p>
                                            <p className="text-xs text-gray-500">{customer.estimatedWaitTime}min</p>
                                        </div>
                                    </div>
                                    {customer.notes && (
                                        <p className="text-sm text-gray-600 mt-1">{customer.notes}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                        Private Consultation ({complexQueue.length})
                    </h4>
                    <div className="space-y-2">
                        {complexQueue.length === 0 ? (
                            <p className="text-sm text-gray-500">No customers waiting</p>
                        ) : (
                            complexQueue.map((customer) => (
                                <div key={customer.id} className="bg-gray-50 p-3 rounded border-l-4 border-cport-green">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium">{customer.name || 'Customer'}</p>
                                            <p className="text-sm text-gray-600">{customer.language.toUpperCase()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-medium ${getMoodColor(customer.mood || 'calm')}`}>
                                                {customer.mood}
                                            </p>
                                            <p className="text-xs text-gray-500">{customer.estimatedWaitTime}min</p>
                                        </div>
                                    </div>
                                    {customer.notes && (
                                        <p className="text-sm text-gray-600 mt-1">{customer.notes}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueueAssignment;