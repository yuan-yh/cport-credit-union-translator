import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useUIPreference } from '../hooks/useUIPreference';
import Header from './common/Header';
import StreamingVoiceTranslationPanel from './common/StreamingVoiceTranslationPanel';
import RedButtonUI from './RedButtonUI';

const TellerDashboard: React.FC = () => {
    const { state, dispatch } = useApp();
    const uiPreference = useUIPreference();

    // Render Red Button UI if selected
    if (uiPreference === 'red-button') {
        return <RedButtonUI />;
    }
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
                            Teller Window
                        </h2>
                        <p style={{ color: '#999999', fontSize: '16px', margin: 0 }}>
                            Serve customers with simple transactions
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                        gap: '24px',
                        justifyContent: 'center'
                    }}>
                        {/* Queue Management */}
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
                                Customer Queue ({simpleQueueCustomers.length} waiting)
                            </h3>

                            {!currentCustomer ? (
                                <div>
                                    {simpleQueueCustomers.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {simpleQueueCustomers.slice(0, 3).map((customer, index) => (
                                                <div key={customer.id} style={{
                                                    padding: '16px',
                                                    borderRadius: '8px',
                                                    border: index === 0 ? '2px solid #3b82f6' : '1px solid #333333',
                                                    backgroundColor: index === 0 ? '#001f3f' : '#0a0a0a'
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}>
                                                        <div>
                                                            <p style={{
                                                                fontWeight: '500',
                                                                color: '#ffffff',
                                                                margin: '0 0 4px 0'
                                                            }}>
                                                                {customer.name || 'Customer'}
                                                            </p>
                                                            <p style={{
                                                                fontSize: '14px',
                                                                color: '#999999',
                                                                margin: '0 0 2px 0'
                                                            }}>
                                                                Language: {customer.language.toUpperCase()}
                                                            </p>
                                                            <p style={{
                                                                fontSize: '14px',
                                                                color: '#999999',
                                                                margin: 0
                                                            }}>
                                                                Wait: {customer.estimatedWaitTime} min
                                                            </p>
                                                        </div>
                                                        {index === 0 && (
                                                            <span style={{
                                                                fontSize: '12px',
                                                                backgroundColor: '#3b82f6',
                                                                color: 'white',
                                                                padding: '4px 12px',
                                                                borderRadius: '12px',
                                                                fontWeight: '500'
                                                            }}>
                                                                NEXT
                                                            </span>
                                                        )}
                                                    </div>
                                                    {customer.notes && (
                                                        <p style={{
                                                            fontSize: '14px',
                                                            color: '#cccccc',
                                                            marginTop: '8px',
                                                            fontStyle: 'italic'
                                                        }}>
                                                            {customer.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}

                                            <button
                                                onClick={handleServeNext}
                                                style={{
                                                    width: '100%',
                                                    backgroundColor: '#1e40af',
                                                    color: 'white',
                                                    padding: '15px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    fontSize: '16px',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    marginTop: '8px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e40af'}
                                            >
                                                Serve Next Customer
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                            <p style={{ color: '#999999', marginBottom: '16px' }}>
                                                No customers in queue
                                            </p>
                                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💤</div>
                                            <p style={{ fontSize: '14px', color: '#666666' }}>
                                                Waiting for customers...
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{
                                        backgroundColor: '#001f3f',
                                        color: 'white',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        border: '1px solid #0066cc'
                                    }}>
                                        <h4 style={{ fontWeight: '600', margin: '0 0 4px 0' }}>
                                            Now Serving
                                        </h4>
                                        <p style={{ color: '#66b3ff', margin: '0 0 2px 0' }}>
                                            {activeCustomer?.name || 'Customer'}
                                        </p>
                                        <p style={{ color: '#99ccff', fontSize: '14px', margin: 0 }}>
                                            Language: {activeCustomer?.language.toUpperCase()}
                                        </p>
                                    </div>

                                    {activeCustomer?.notes && (
                                        <div style={{
                                            backgroundColor: 'rgba(217, 119, 6, 0.1)',
                                            border: '1px solid rgba(217, 119, 6, 0.3)',
                                            padding: '12px',
                                            borderRadius: '8px'
                                        }}>
                                            <p style={{ fontSize: '14px', color: '#fbbf24', margin: 0 }}>
                                                <strong>Notes:</strong> {activeCustomer.notes}
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setShowTranslation(!showTranslation)}
                                        style={{
                                            width: '100%',
                                            backgroundColor: '#059669',
                                            color: 'white',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                                    >
                                        {showTranslation ? 'Hide Translation' : 'Start Translation'}
                                    </button>

                                    <button
                                        onClick={handleCompleteService}
                                        style={{
                                            width: '100%',
                                            backgroundColor: '#555555',
                                            color: 'white',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#666666'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#555555'}
                                    >
                                        Complete Service
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Banking Work Area */}
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
                                Banking System
                            </h3>

                            <div style={{
                                backgroundColor: '#0a0a0a',
                                padding: '16px',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                border: '1px solid #333333'
                            }}>
                                <p style={{ fontSize: '14px', color: '#999999', marginBottom: '12px' }}>
                                    Simulated Banking Interface
                                </p>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '8px',
                                    fontSize: '12px'
                                }}>
                                    <div style={{
                                        backgroundColor: '#1a1a1a',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        color: '#cccccc'
                                    }}>
                                        Account: ****1234
                                    </div>
                                    <div style={{
                                        backgroundColor: '#1a1a1a',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        color: '#cccccc'
                                    }}>
                                        Balance: $1,247.56
                                    </div>
                                    <div style={{
                                        backgroundColor: '#1a1a1a',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        color: '#cccccc'
                                    }}>
                                        Type: Checking
                                    </div>
                                    <div style={{
                                        backgroundColor: '#1a1a1a',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        color: '#cccccc'
                                    }}>
                                        Status: Active
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button style={{
                                    width: '100%',
                                    backgroundColor: '#059669',
                                    color: 'white',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}>
                                    Process Deposit
                                </button>
                                <button style={{
                                    width: '100%',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}>
                                    Process Withdrawal
                                </button>
                                <button style={{
                                    width: '100%',
                                    backgroundColor: '#8b5cf6',
                                    color: 'white',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}>
                                    Account Inquiry
                                </button>
                                <button style={{
                                    width: '100%',
                                    backgroundColor: '#f59e0b',
                                    color: 'white',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}>
                                    Print Statement
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Translation Modal */}
                    {showTranslation && activeCustomer && (
                        <StreamingVoiceTranslationPanel
                            targetLanguage={activeCustomer.language}
                            onClose={() => setShowTranslation(false)}
                            onCustomerDataUpdate={(data) => {
                                dispatch({
                                    type: 'UPDATE_CUSTOMER',
                                    payload: {
                                        id: activeCustomer.id,
                                        updates: data
                                    }
                                });
                            }}
                            currentCustomerData={activeCustomer}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default TellerDashboard;