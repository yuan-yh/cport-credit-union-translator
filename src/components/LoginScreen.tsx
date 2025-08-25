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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cport-blue to-cport-light">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-cport-blue">cPort Credit Union</h1>
                    <p className="text-gray-600 mt-2">Translation Tool - Prototype</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Your Role
                        </label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-cport-blue focus:border-cport-blue"
                        >
                            <option value="greeter">Greeter (Universal Banker)</option>
                            <option value="teller">Teller</option>
                            <option value="consultor">Private Consultor</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>

                    <button
                        onClick={handleLogin}
                        className="w-full bg-cport-blue text-white py-3 rounded-md hover:bg-cport-light transition-colors font-medium"
                    >
                        Sign In
                    </button>
                </div>

                <div className="mt-6 text-xs text-gray-500 text-center">
                    <p>Prototype Demo - No actual authentication required</p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;