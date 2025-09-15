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
        <header className="bg-cport-blue text-white p-4 shadow-md">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold">cPort Real-time Interpreter</h1>
                    <p className="text-blue-200 text-sm">
                        {state.currentUser?.name} - {state.currentUser?.role?.toUpperCase()}
                    </p>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-cport-green rounded-full"></div>
                        <span className="text-sm">System Online</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="bg-cport-light px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;