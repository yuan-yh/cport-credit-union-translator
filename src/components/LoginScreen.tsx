import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';

const LoginScreen: React.FC = () => {
    const navigate = useNavigate();
    const { dispatch } = useApp();
    const [selectedRole, setSelectedRole] = useState<UserRole>('greeter');

    // Redirect to UI selection if no preference is set
    useEffect(() => {
        const uiPreference = localStorage.getItem('uiPreference');
        if (!uiPreference) {
            navigate('/');
        }
    }, [navigate]);

    const handleLogin = () => {
        const mockUser = {
            id: `user_${Date.now()}`,
            name: `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} User`,
            role: selectedRole
        };
        dispatch({ type: 'SET_USER', payload: mockUser });
        navigate(`/${selectedRole}`);
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
                maxWidth: '500px',
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
                        Real-time Translation System
                    </p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#cccccc',
                        marginBottom: '8px'
                    }}>
                        Select Your Role
                    </label>
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                        style={{
                            width: '100%',
                            padding: '15px',
                            border: '1px solid #666666',
                            borderRadius: '8px',
                            fontSize: '16px',
                            backgroundColor: '#333333',
                            color: '#ffffff',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="greeter">Greeter (Universal Banker)</option>
                        <option value="teller">Teller</option>
                        <option value="consultor">Private Consultor</option>
                        <option value="admin">Administrator</option>
                    </select>
                </div>

                <button
                    onClick={handleLogin}
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
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e40af'}
                >
                    Sign In
                </button>

                <div style={{
                    marginTop: '24px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#666666'
                }}>
                    <p style={{ margin: 0 }}>Prototype Demo - No authentication required</p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;