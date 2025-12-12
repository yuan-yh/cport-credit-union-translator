import React from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
    const { state } = useApp();
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/');
    };

    return (
        <header style={{
            backgroundColor: '#1a1a1a',
            color: 'white',
            padding: '16px 24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
            borderBottom: '1px solid #333333'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#3b82f6',
                        margin: '0 0 4px 0'
                    }}>
                        cPort Real-time Interpreter
                    </h1>
                    <p style={{
                        color: '#999999',
                        fontSize: '14px',
                        margin: 0
                    }}>
                        {state.currentUser?.name} - {state.currentUser?.role?.toUpperCase()}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="connection-badge connected">
                        <div className="connection-badge-dot"></div>
                        <span>System Online</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            backgroundColor: '#3b82f6',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            border: 'none',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;