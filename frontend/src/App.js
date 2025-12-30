import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Shield, 
  Network, 
  Activity, 
  AlertTriangle, 
  Target, 
  Eye, 
  Settings,
  Cpu,
  Lock,
  TrendingUp
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Threats from './pages/Threats';
import Behavioral from './pages/Behavioral';
import Honeypots from './pages/Honeypots';
import Agents from './pages/Agents';
import NetworkTopology from './pages/NetworkTopology';
import Incidents from './pages/Incidents';
import { Toaster } from './components/ui/sonner';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Sidebar() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Shield, label: 'Dashboard' },
    { path: '/devices', icon: Network, label: 'Devices' },
    { path: '/threats', icon: AlertTriangle, label: 'Threats' },
    { path: '/behavioral', icon: Activity, label: 'Behavioral' },
    { path: '/honeypots', icon: Target, label: 'Honeypots' },
    { path: '/agents', icon: Cpu, label: 'AI Agents' },
    { path: '/topology', icon: TrendingUp, label: 'Network Map' },
    { path: '/incidents', icon: Eye, label: 'Incidents' },
  ];
  
  return (
    <div className="fixed left-0 top-0 h-screen w-64 glass-card border-r border-primary/20 p-6 flex flex-col" data-testid="sidebar">
      <div className="mb-12">
        <div className="flex items-center gap-3">
          <Lock className="w-8 h-8 text-primary" />
          <h1 className="font-heading text-2xl font-bold uppercase tracking-tight">Guardian</h1>
        </div>
        <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">IoT Security Platform</p>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/30 neon-glow' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-mono text-sm uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-6 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>SYSTEM OPERATIONAL</span>
        </div>
      </div>
    </div>
  );
}

function AppLayout() {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        const response = await axios.get(`${API}/stats`);
        if (response.data.total_devices > 0) {
          setInitialized(true);
        } else {
          await axios.post(`${API}/initialize`);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSystem();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Cpu className="w-16 h-16 text-primary animate-pulse mx-auto mb-4" />
          <p className="font-mono text-sm text-muted-foreground uppercase tracking-widest">Initializing Security Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-64 p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/threats" element={<Threats />} />
          <Route path="/behavioral" element={<Behavioral />} />
          <Route path="/honeypots" element={<Honeypots />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/topology" element={<NetworkTopology />} />
          <Route path="/incidents" element={<Incidents />} />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;