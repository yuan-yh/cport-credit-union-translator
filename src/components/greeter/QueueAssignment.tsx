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
            case 'urgent': return '#ef4444';
            case 'anxious': return '#f59e0b';
            default: return '#10b981';
        }
    };

    return (
        <div style={{
            backgroundColor: '#1a1a1a',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.4)',
            border: '1px solid #333333'
        }}>
            <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#ffffff'
            }}>
                Queue Status
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <h4 style={{
                        fontWeight: '500',
                        color: '#ffffff',
                        marginBottom: '8px',
                        fontSize: '16px'
                    }}>
                        Teller Line ({simpleQueue.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {simpleQueue.length === 0 ? (
                            <p style={{ fontSize: '14px', color: '#999999' }}>No customers waiting</p>
                        ) : (
                            simpleQueue.map((customer) => (
                                <div key={customer.id} style={{
                                    backgroundColor: '#0a0a0a',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    borderLeft: '4px solid #3b82f6',
                                    border: '1px solid #333333'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start'
                                    }}>
                                        <div>
                                            <p style={{
                                                fontWeight: '500',
                                                color: '#ffffff',
                                                margin: '0 0 2px 0'
                                            }}>
                                                {customer.name || 'Customer'}
                                            </p>
                                            <p style={{
                                                fontSize: '14px',
                                                color: '#999999',
                                                margin: 0
                                            }}>
                                                {customer.language.toUpperCase()}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                margin: '0 0 2px 0',
                                                color: getMoodColor(customer.mood || 'calm')
                                            }}>
                                                {customer.mood}
                                            </p>
                                            <p style={{
                                                fontSize: '12px',
                                                color: '#999999',
                                                margin: 0
                                            }}>
                                                {customer.estimatedWaitTime}min
                                            </p>
                                        </div>
                                    </div>
                                    {customer.notes && (
                                        <p style={{
                                            fontSize: '14px',
                                            color: '#cccccc',
                                            marginTop: '8px'
                                        }}>
                                            {customer.notes}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div>
                    <h4 style={{
                        fontWeight: '500',
                        color: '#ffffff',
                        marginBottom: '8px',
                        fontSize: '16px'
                    }}>
                        Private Consultation ({complexQueue.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {complexQueue.length === 0 ? (
                            <p style={{ fontSize: '14px', color: '#999999' }}>No customers waiting</p>
                        ) : (
                            complexQueue.map((customer) => (
                                <div key={customer.id} style={{
                                    backgroundColor: '#0a0a0a',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    borderLeft: '4px solid #059669',
                                    border: '1px solid #333333'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start'
                                    }}>
                                        <div>
                                            <p style={{
                                                fontWeight: '500',
                                                color: '#ffffff',
                                                margin: '0 0 2px 0'
                                            }}>
                                                {customer.name || 'Customer'}
                                            </p>
                                            <p style={{
                                                fontSize: '14px',
                                                color: '#999999',
                                                margin: 0
                                            }}>
                                                {customer.language.toUpperCase()}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                margin: '0 0 2px 0',
                                                color: getMoodColor(customer.mood || 'calm')
                                            }}>
                                                {customer.mood}
                                            </p>
                                            <p style={{
                                                fontSize: '12px',
                                                color: '#999999',
                                                margin: 0
                                            }}>
                                                {customer.estimatedWaitTime}min
                                            </p>
                                        </div>
                                    </div>
                                    {customer.notes && (
                                        <p style={{
                                            fontSize: '14px',
                                            color: '#cccccc',
                                            marginTop: '8px'
                                        }}>
                                            {customer.notes}
                                        </p>
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