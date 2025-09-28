import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';

const LoginScreen: React.FC = () => {
    const navigate = useNavigate();
    const { dispatch } = useApp();
    const [selectedRole, setSelectedRole] = useState<UserRole>('greeter');

    const handleLogin = () => {
        // Mock user login
        const mockUser = {
            id: `user_${Date.now()}`,
            name: `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} User`,
            role: selectedRole
        };

        dispatch({ type: 'SET_USER', payload: mockUser });
        navigate(`/${selectedRole}`);
    };

    return (
        <div className="login-page">
            <div className="login-container fade-in">
                <div className="login-logo">cP</div>
                <h1 className="login-title">cPort Credit Union</h1>
                <p className="login-subtitle">Translation Tool - Professional Access</p>
                
                <select 
                    className="role-selector"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                >
                    <option value="greeter">Greeter (Universal Banker)</option>
                    <option value="teller">Senior Teller</option>
                    <option value="consultor">Customer Service Representative</option>
                    <option value="admin">Loan Officer</option>
                    <option value="admin">Branch Manager</option>
                    <option value="admin">Assistant Manager</option>
                </select>
                
                <button className="login-btn" onClick={handleLogin}>
                    🔐 Access System
                </button>
                
                <p className="demo-notice">Secure prototype environment - Authentication simulated</p>
            </div>
        </div>
    );
};

export default LoginScreen;