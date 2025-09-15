import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import GreeterDashboard from './components/GreeterDashboard';
import TellerDashboard from './components/TellerDashboard';
import ConsultorDashboard from './components/ConsultorDashboard';
import './App.css';
import './styles/enterprise-design.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<LoginScreen />} />
            <Route path="/greeter" element={<GreeterDashboard />} />
            <Route path="/teller" element={<TellerDashboard />} />
            <Route path="/consultor" element={<ConsultorDashboard />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;