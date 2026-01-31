import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type UIPreference = 'standard' | 'red-button';

const UISelectionScreen: React.FC = () => {
    const navigate = useNavigate();
    const [selectedUI, setSelectedUI] = useState<UIPreference>('standard');

    const handleContinue = () => {
        // Store UI preference in localStorage
        localStorage.setItem('uiPreference', selectedUI);
        // Navigate to login screen
        navigate('/login');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000000',
            backgroundImage: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)'
        }}>
            <div style={{
                backgroundColor: '#1a1a1a',
                padding: '48px',
                borderRadius: '12px',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
                border: '1px solid #333333',
                maxWidth: '600px',
                width: '90%'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: '#3b82f6',
                        margin: '0 0 8px 0'
                    }}>
                        cPort Credit Union
                    </h1>
                    <p style={{ color: '#999999', margin: 0, fontSize: '16px' }}>
                        Select Your Preferred Interface
                    </p>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        marginBottom: '24px'
                    }}>
                        {/* Standard UI Option */}
                        <div
                            onClick={() => setSelectedUI('standard')}
                            style={{
                                padding: '24px',
                                border: selectedUI === 'standard' ? '2px solid #3b82f6' : '2px solid #333333',
                                borderRadius: '8px',
                                backgroundColor: selectedUI === 'standard' ? '#1e3a5f' : '#2a2a2a',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textAlign: 'center'
                            }}
                            onMouseEnter={(e) => {
                                if (selectedUI !== 'standard') {
                                    e.currentTarget.style.borderColor = '#555555';
                                    e.currentTarget.style.backgroundColor = '#333333';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedUI !== 'standard') {
                                    e.currentTarget.style.borderColor = '#333333';
                                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                                }
                            }}
                        >
                            <div style={{
                                width: '60px',
                                height: '60px',
                                margin: '0 auto 16px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px'
                            }}>
                                📋
                            </div>
                            <h3 style={{
                                color: '#ffffff',
                                margin: '0 0 8px 0',
                                fontSize: '18px',
                                fontWeight: '600'
                            }}>
                                Standard UI
                            </h3>
                            <p style={{
                                color: '#999999',
                                margin: 0,
                                fontSize: '14px'
                            }}>
                                Traditional interface with panels and controls
                            </p>
                        </div>

                        {/* Red Button UI Option */}
                        <div
                            onClick={() => setSelectedUI('red-button')}
                            style={{
                                padding: '24px',
                                border: selectedUI === 'red-button' ? '2px solid #dc2626' : '2px solid #333333',
                                borderRadius: '8px',
                                backgroundColor: selectedUI === 'red-button' ? '#5f1e1e' : '#2a2a2a',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textAlign: 'center'
                            }}
                            onMouseEnter={(e) => {
                                if (selectedUI !== 'red-button') {
                                    e.currentTarget.style.borderColor = '#555555';
                                    e.currentTarget.style.backgroundColor = '#333333';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedUI !== 'red-button') {
                                    e.currentTarget.style.borderColor = '#333333';
                                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                                }
                            }}
                        >
                            <div style={{
                                width: '60px',
                                height: '60px',
                                margin: '0 auto 16px',
                                backgroundColor: '#dc2626',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                boxShadow: selectedUI === 'red-button' ? '0 0 20px rgba(220, 38, 38, 0.5)' : 'none'
                            }}>
                                🔴
                            </div>
                            <h3 style={{
                                color: '#ffffff',
                                margin: '0 0 8px 0',
                                fontSize: '18px',
                                fontWeight: '600'
                            }}>
                                Red Button UI
                            </h3>
                            <p style={{
                                color: '#999999',
                                margin: 0,
                                fontSize: '14px'
                            }}>
                                Minimalist interface with large red button
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleContinue}
                    style={{
                        width: '100%',
                        backgroundColor: selectedUI === 'red-button' ? '#dc2626' : '#1e40af',
                        color: 'white',
                        padding: '15px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = selectedUI === 'red-button' ? '#ef4444' : '#3b82f6';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = selectedUI === 'red-button' ? '#dc2626' : '#1e40af';
                    }}
                >
                    Continue
                </button>

                <div style={{
                    marginTop: '24px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#666666'
                }}>
                    <p style={{ margin: 0 }}>You can change this preference later in settings</p>
                </div>
            </div>
        </div>
    );
};

export default UISelectionScreen;

