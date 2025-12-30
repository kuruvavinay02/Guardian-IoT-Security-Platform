import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Behavioral() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [behaviors, setBehaviors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${API}/devices`);
      setDevices(response.data.filter(d => !d.is_honeypot));
      if (response.data.length > 0) {
        setSelectedDevice(response.data[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch devices');
    }
  };

  const generateBehaviors = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/behaviors/simulate`);
      if (selectedDevice) {
        fetchBehaviors(selectedDevice.id);
      }
      toast.success('Behavior data generated');
    } catch (error) {
      toast.error('Failed to generate behaviors');
    } finally {
      setLoading(false);
    }
  };

  const fetchBehaviors = async (deviceId) => {
    try {
      const response = await axios.get(`${API}/behaviors/${deviceId}`);
      setBehaviors(response.data);
    } catch (error) {
      console.error('Failed to fetch behaviors:', error);
    }
  };

  useEffect(() => {
    if (selectedDevice) {
      fetchBehaviors(selectedDevice.id);
    }
  }, [selectedDevice]);

  const chartData = behaviors.slice(0, 10).map((b, idx) => ({
    time: idx,
    traffic: b.traffic_volume,
    connections: b.connection_count,
    anomaly: b.is_anomaly ? b.traffic_volume : null
  }));

  return (
    <div className="space-y-8" data-testid="behavioral-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold uppercase tracking-tight">Behavioral Analysis</h1>
          <p className="text-muted-foreground mt-2">AI-powered baseline learning and anomaly detection</p>
        </div>
        <Button 
          onClick={generateBehaviors}
          disabled={loading}
          className="font-mono uppercase tracking-wider"
          data-testid="generate-behaviors-btn"
        >
          {loading ? 'Generating...' : 'Generate Data'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg uppercase tracking-tight">Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`w-full text-left p-3 rounded-sm transition-all duration-200 ${
                    selectedDevice?.id === device.id
                      ? 'bg-primary/10 border border-primary/30 text-primary'
                      : 'bg-accent/30 border border-border/30 hover:border-primary/30'
                  }`}
                  data-testid="device-selector-btn"
                >
                  <p className="font-mono text-sm font-medium">{device.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{device.ip_address}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {selectedDevice && (
            <>
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-heading text-lg uppercase tracking-tight">
                    {selectedDevice.name} - Traffic Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="time" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0a0a0a', 
                          border: '1px solid #27272a',
                          borderRadius: '4px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="traffic" 
                        stroke="#00f0ff" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="anomaly" 
                        stroke="#ff2a6d" 
                        strokeWidth={3}
                        dot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-heading text-lg uppercase tracking-tight">Detected Anomalies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {behaviors.filter(b => b.is_anomaly).length === 0 ? (
                      <p className="text-muted-foreground text-sm">No anomalies detected</p>
                    ) : (
                      behaviors.filter(b => b.is_anomaly).slice(0, 5).map((behavior, idx) => (
                        <div 
                          key={idx} 
                          className="p-4 rounded-sm bg-destructive/10 border border-destructive/30"
                          data-testid="anomaly-item"
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                            <div className="flex-1">
                              <p className="font-mono text-sm font-medium">Unusual Traffic Pattern</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Traffic volume: {behavior.traffic_volume.toFixed(2)} MB/s 
                                ({behavior.connection_count} connections)
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Anomaly score: {(behavior.anomaly_score * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}