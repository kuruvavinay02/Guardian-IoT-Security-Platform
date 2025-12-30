import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Network, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${API}/devices`);
      setDevices(response.data);
    } catch (error) {
      toast.error('Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const isolateDevice = async (deviceId, deviceName) => {
    try {
      await axios.post(`${API}/devices/${deviceId}/isolate`);
      toast.success(`${deviceName} has been isolated from the network`);
      fetchDevices();
    } catch (error) {
      toast.error('Failed to isolate device');
    }
  };

  const getRiskColor = (score) => {
    if (score < 40) return 'text-green-500';
    if (score < 70) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getRiskBadge = (score) => {
    if (score < 40) return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Low</Badge>;
    if (score < 70) return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Medium</Badge>;
    return <Badge className="bg-destructive/20 text-destructive border-destructive/30">High</Badge>;
  };

  return (
    <div className="space-y-8" data-testid="devices-page">
      <div>
        <h1 className="font-heading text-4xl font-bold uppercase tracking-tight">Device Management</h1>
        <p className="text-muted-foreground mt-2">Monitor and manage all discovered IoT devices on your network</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <Card 
            key={device.id} 
            className={`glass-card border-border/50 hover:border-primary/50 transition-all duration-300 ${
              device.is_honeypot ? 'border-primary/50 neon-glow' : ''
            }`}
            data-testid="device-card"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="font-mono text-lg font-semibold">{device.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{device.device_type}</p>
                </div>
                {device.is_honeypot ? (
                  <Shield className="w-5 h-5 text-primary" />
                ) : (
                  <Network className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Risk Score</span>
                  <span className={`text-2xl font-heading font-bold ${getRiskColor(device.risk_score)}`}>
                    {device.risk_score}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <div className="flex items-center gap-2">
                      {device.status === 'online' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : device.status === 'isolated' ? (
                        <XCircle className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-mono uppercase text-xs">{device.status}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Risk Level</span>
                    {getRiskBadge(device.risk_score)}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50 space-y-1">
                  <div className="text-xs">
                    <span className="text-muted-foreground">IP:</span>
                    <span className="ml-2 font-mono">{device.ip_address}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">MAC:</span>
                    <span className="ml-2 font-mono">{device.mac_address}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Manufacturer:</span>
                    <span className="ml-2">{device.manufacturer}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Firmware:</span>
                    <span className="ml-2 font-mono">{device.firmware_version}</span>
                  </div>
                </div>

                {device.is_honeypot && (
                  <div className="pt-2 border-t border-primary/30">
                    <p className="text-xs text-primary font-mono uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      Honeypot Device
                    </p>
                  </div>
                )}

                {!device.is_honeypot && device.status !== 'isolated' && device.risk_score >= 70 && (
                  <Button
                    onClick={() => isolateDevice(device.id, device.name)}
                    variant="destructive"
                    size="sm"
                    className="w-full font-mono uppercase tracking-wider"
                    data-testid="isolate-device-btn"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Isolate Device
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}