import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Activity, AlertTriangle, Network, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [devices, setDevices] = useState([]);
  const [threats, setThreats] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, devicesRes, threatsRes, alertsRes] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/devices`),
        axios.get(`${API}/threats`),
        axios.get(`${API}/alerts`)
      ]);
      
      setStats(statsRes.data);
      setDevices(devicesRes.data);
      setThreats(threatsRes.data);
      setAlerts(alertsRes.data.slice(0, 5));
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const riskDistribution = devices.reduce((acc, device) => {
    if (device.risk_score < 40) acc.low++;
    else if (device.risk_score < 70) acc.medium++;
    else acc.high++;
    return acc;
  }, { low: 0, medium: 0, high: 0 });

  const chartData = [
    { name: 'Low', value: riskDistribution.low, fill: '#00ff9d' },
    { name: 'Medium', value: riskDistribution.medium, fill: '#ffb800' },
    { name: 'High', value: riskDistribution.high, fill: '#ff2a6d' },
  ];

  const statusColors = {
    good: 'status-safe',
    warning: 'status-warning',
    critical: 'status-critical'
  };

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold uppercase tracking-tight">Security Overview</h1>
          <p className="text-muted-foreground mt-2">Real-time IoT network monitoring and threat intelligence</p>
        </div>
        <Button 
          onClick={fetchData} 
          disabled={loading}
          className="font-mono uppercase tracking-wider"
          data-testid="refresh-dashboard-btn"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300" data-testid="total-devices-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Total Devices</CardTitle>
            <Network className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-primary">{stats?.total_devices || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Discovered on network</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300" data-testid="active-threats-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Active Threats</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-destructive">{stats?.active_threats || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Detected and monitoring</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300" data-testid="network-health-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Network Health</CardTitle>
            <Activity className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-heading font-bold uppercase ${statusColors[stats?.network_health || 'good']}`}>
              {stats?.network_health || 'Good'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall system status</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300" data-testid="honeypots-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Honeypots</CardTitle>
            <Shield className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-primary">{stats?.active_honeypots || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active deception devices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-xl uppercase tracking-tight">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #27272a',
                    borderRadius: '4px'
                  }} 
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50" data-testid="recent-alerts-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl uppercase tracking-tight">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recent alerts</p>
              ) : (
                alerts.map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-sm bg-accent/50 border border-border/30">
                    <div className={`w-2 h-2 rounded-full mt-1 ${
                      alert.severity === 'high' ? 'bg-destructive' :
                      alert.severity === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs uppercase text-muted-foreground">{alert.title}</p>
                      <p className="text-sm mt-1 truncate">{alert.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-border/50" data-testid="critical-devices-card">
        <CardHeader>
          <CardTitle className="font-heading text-xl uppercase tracking-tight">High-Risk Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {devices
              .filter(d => d.risk_score >= 70)
              .slice(0, 5)
              .map((device, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-sm bg-accent/30 border border-destructive/30">
                  <div>
                    <p className="font-mono text-sm font-medium">{device.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{device.ip_address} • {device.manufacturer}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-heading font-bold text-destructive">{device.risk_score}</div>
                    <p className="text-xs text-muted-foreground uppercase">Risk Score</p>
                  </div>
                </div>
              ))}
            {devices.filter(d => d.risk_score >= 70).length === 0 && (
              <p className="text-muted-foreground text-sm">No high-risk devices detected</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}