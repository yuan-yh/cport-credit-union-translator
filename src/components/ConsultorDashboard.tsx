import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useUIPreference } from '../hooks/useUIPreference';
import Header from './common/Header';
import StreamingVoiceTranslationPanel from './common/StreamingVoiceTranslationPanel';
import RedButtonUI from './RedButtonUI';

const ConsultorDashboard: React.FC = () => {
    const { state, dispatch } = useApp();
    const uiPreference = useUIPreference();

    // Render Red Button UI if selected
    if (uiPreference === 'red-button') {
        return <RedButtonUI />;
    }
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
                    maxWidth: '1600px', 
                    width: '100%'
                }}>
                    <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                        <h2 style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            marginBottom: '8px'
                        }}>
                            Private Consultation
                        </h2>
                        <p style={{ color: '#999999', fontSize: '16px', margin: 0 }}>
                            Complex services: loans, new accounts, financial planning
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
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
                                Consultation Queue ({complexQueueCustomers.length})
                            </h3>

                            {!currentCustomer ? (
                                <div>
                                    {complexQueueCustomers.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {complexQueueCustomers.map((customer, index) => (
                                                <div key={customer.id} style={{
                                                    padding: '16px',
                                                    borderRadius: '8px',
                                                    border: index === 0 ? '2px solid #059669' : '1px solid #333333',
                                                    backgroundColor: index === 0 ? '#004d00' : '#0a0a0a'
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
                                                                margin: '0 0 4px 0'
                                                            }}>
                                                                {customer.name || 'Customer'}
                                                            </p>
                                                            <p style={{
                                                                fontSize: '14px',
                                                                color: '#999999',
                                                                margin: '0 0 2px 0'
                                                            }}>
                                                                {customer.language.toUpperCase()}
                                                            </p>
                                                            <p style={{
                                                                fontSize: '14px',
                                                                color: '#999999',
                                                                margin: 0
                                                            }}>
                                                                Est: {customer.estimatedWaitTime} min
                                                            </p>
                                                        </div>
                                                        {index === 0 && (
                                                            <span style={{
                                                                fontSize: '12px',
                                                                backgroundColor: '#059669',
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
                                                    backgroundColor: '#059669',
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
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                                            >
                                                Begin Consultation
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                            <p style={{ color: '#999999', marginBottom: '16px' }}>
                                                No consultations scheduled
                                            </p>
                                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                                            <p style={{ fontSize: '14px', color: '#666666' }}>
                                                Ready for complex services
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{
                                        backgroundColor: '#004d00',
                                        color: 'white',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        border: '1px solid #00cc00'
                                    }}>
                                        <h4 style={{ fontWeight: '600', margin: '0 0 4px 0' }}>
                                            In Consultation
                                        </h4>
                                        <p style={{ color: '#66ff66', margin: '0 0 2px 0' }}>
                                            {activeCustomer?.name || 'Customer'}
                                        </p>
                                        <p style={{ color: '#99ff99', fontSize: '14px', margin: 0 }}>
                                            Language: {activeCustomer?.language.toUpperCase()}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setShowTranslation(!showTranslation)}
                                        style={{
                                            width: '100%',
                                            backgroundColor: '#1e40af',
                                            color: 'white',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e40af'}
                                    >
                                        {showTranslation ? 'Hide Translation' : 'Open Translation'}
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
                                        Complete Consultation
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Service Progress */}
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
                                Service Progress
                            </h3>

                            {currentCustomer ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ marginBottom: '8px' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '14px',
                                            marginBottom: '8px',
                                            color: '#cccccc'
                                        }}>
                                            <span>Progress</span>
                                            <span>{Math.round((serviceProgress / (serviceSteps.length - 1)) * 100)}%</span>
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            backgroundColor: '#333333',
                                            borderRadius: '9999px',
                                            height: '8px'
                                        }}>
                                            <div
                                                style={{
                                                    backgroundColor: '#059669',
                                                    height: '8px',
                                                    borderRadius: '9999px',
                                                    transition: 'all 0.3s',
                                                    width: `${(serviceProgress / (serviceSteps.length - 1)) * 100}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {serviceSteps.map((step, index) => (
                                            <div key={index} style={{
                                                padding: '12px',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                backgroundColor: index < serviceProgress ? '#004d00' :
                                                    index === serviceProgress ? '#001f3f' : '#0a0a0a',
                                                color: index < serviceProgress ? '#66ff66' :
                                                    index === serviceProgress ? '#66b3ff' : '#666666',
                                                border: index < serviceProgress ? '1px solid #00cc00' :
                                                    index === serviceProgress ? '1px solid #0066cc' : '1px solid #333333',
                                                fontWeight: index === serviceProgress ? '500' : '400'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <div style={{
                                                        width: '16px',
                                                        height: '16px',
                                                        borderRadius: '50%',
                                                        marginRight: '8px',
                                                        backgroundColor: index < serviceProgress ? '#059669' :
                                                            index === serviceProgress ? '#3b82f6' : '#666666'
                                                    }}></div>
                                                    {step}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => setServiceProgress(Math.max(0, serviceProgress - 1))}
                                            disabled={serviceProgress === 0}
                                            style={{
                                                flex: 1,
                                                backgroundColor: serviceProgress === 0 ? '#333333' : '#555555',
                                                color: serviceProgress === 0 ? '#666666' : '#ffffff',
                                                padding: '10px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                fontSize: '14px',
                                                cursor: serviceProgress === 0 ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            Previous Step
                                        </button>
                                        <button
                                            onClick={() => setServiceProgress(Math.min(serviceSteps.length - 1, serviceProgress + 1))}
                                            disabled={serviceProgress === serviceSteps.length - 1}
                                            style={{
                                                flex: 1,
                                                backgroundColor: serviceProgress === serviceSteps.length - 1 ? '#333333' : '#1e40af',
                                                color: serviceProgress === serviceSteps.length - 1 ? '#666666' : '#ffffff',
                                                padding: '10px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                fontSize: '14px',
                                                cursor: serviceProgress === serviceSteps.length - 1 ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            Next Step
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                    <p style={{ color: '#999999' }}>No active consultation</p>
                                </div>
                            )}
                        </div>

                        {/* Document Tools */}
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
                                Document Tools
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{
                                    padding: '12px',
                                    border: '1px solid #333333',
                                    borderRadius: '8px',
                                    backgroundColor: '#0a0a0a'
                                }}>
                                    <h4 style={{
                                        fontWeight: '500',
                                        fontSize: '14px',
                                        marginBottom: '8px',
                                        color: '#ffffff'
                                    }}>
                                        Loan Calculator
                                    </h4>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        fontSize: '12px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#cccccc' }}>Amount:</span>
                                            <input
                                                type="number"
                                                placeholder="$25,000"
                                                style={{
                                                    width: '100px',
                                                    padding: '4px 8px',
                                                    border: '1px solid #666666',
                                                    borderRadius: '4px',
                                                    backgroundColor: '#333333',
                                                    color: '#ffffff'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#cccccc' }}>Rate:</span>
                                            <input
                                                type="number"
                                                placeholder="5.5%"
                                                style={{
                                                    width: '100px',
                                                    padding: '4px 8px',
                                                    border: '1px solid #666666',
                                                    borderRadius: '4px',
                                                    backgroundColor: '#333333',
                                                    color: '#ffffff'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#cccccc' }}>Term:</span>
                                            <input
                                                type="number"
                                                placeholder="60 mo"
                                                style={{
                                                    width: '100px',
                                                    padding: '4px 8px',
                                                    border: '1px solid #666666',
                                                    borderRadius: '4px',
                                                    backgroundColor: '#333333',
                                                    color: '#ffffff'
                                                }}
                                            />
                                        </div>
                                        <button style={{
                                            width: '100%',
                                            backgroundColor: '#3b82f6',
                                            color: 'white',
                                            padding: '6px',
                                            borderRadius: '4px',
                                            border: 'none',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}>
                                            Calculate
                                        </button>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '12px',
                                    border: '1px solid #333333',
                                    borderRadius: '8px',
                                    backgroundColor: '#0a0a0a'
                                }}>
                                    <h4 style={{
                                        fontWeight: '500',
                                        fontSize: '14px',
                                        marginBottom: '8px',
                                        color: '#ffffff'
                                    }}>
                                        Document Upload
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <input
                                            type="file"
                                            style={{
                                                fontSize: '12px',
                                                color: '#cccccc',
                                                width: '100%'
                                            }}
                                        />
                                        <button style={{
                                            width: '100%',
                                            backgroundColor: '#059669',
                                            color: 'white',
                                            padding: '6px',
                                            borderRadius: '4px',
                                            border: 'none',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}>
                                            Translate Document
                                        </button>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '12px',
                                    border: '1px solid #333333',
                                    borderRadius: '8px',
                                    backgroundColor: '#0a0a0a'
                                }}>
                                    <h4 style={{
                                        fontWeight: '500',
                                        fontSize: '14px',
                                        marginBottom: '8px',
                                        color: '#ffffff'
                                    }}>
                                        Quick Phrases
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <button style={{
                                            width: '100%',
                                            backgroundColor: '#333333',
                                            color: '#cccccc',
                                            padding: '6px',
                                            borderRadius: '4px',
                                            border: 'none',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}>
                                            "Let me explain this form..."
                                        </button>
                                        <button style={{
                                            width: '100%',
                                            backgroundColor: '#333333',
                                            color: '#cccccc',
                                            padding: '6px',
                                            borderRadius: '4px',
                                            border: 'none',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}>
                                            "What is your monthly income?"
                                        </button>
                                        <button style={{
                                            width: '100%',
                                            backgroundColor: '#333333',
                                            color: '#cccccc',
                                            padding: '6px',
                                            borderRadius: '4px',
                                            border: 'none',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}>
                                            "This is the interest rate..."
                                        </button>
                                    </div>
                                </div>
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

export default ConsultorDashboard;