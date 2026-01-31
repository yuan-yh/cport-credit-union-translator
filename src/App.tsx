import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import UISelectionScreen from './components/UISelectionScreen';
import LoginScreen from './components/LoginScreen';
import GreeterDashboard from './components/GreeterDashboard';
import TellerDashboard from './components/TellerDashboard';
import ConsultorDashboard from './components/ConsultorDashboard';
import './styles/enterprise-design.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div style={{
          width: '100%',
          height: '100vh',
          backgroundColor: '#000000',
          display: 'flex',
          flexDirection: 'column',
          margin: 0,
          padding: 0
        }}>
          <Routes>
            <Route path="/" element={<UISelectionScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/greeter" element={<GreeterDashboard />} />
            <Route path="/teller" element={<TellerDashboard />} />
            <Route path="/consultor" element={<ConsultorDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;