import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, Shield, Activity, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Honeypots() {
  const [honeypots, setHoneypots] = useState([]);
  const [stats, setStats] = useState({ total: 0, interactions: 0 });

  useEffect(() => {
    fetchHoneypots();
  }, []);

  const fetchHoneypots = async () => {
    try {
      const response = await axios.get(`${API}/devices`);
      const honeypotsData = response.data.filter(d => d.is_honeypot);
      setHoneypots(honeypotsData);
      setStats({
        total: honeypotsData.length,
        interactions: Math.floor(Math.random() * 50) + 10
      });
    } catch (error) {
      toast.error('Failed to fetch honeypots');
    }
  };

  return (
    <div className="space-y-8" data-testid="honeypots-page">
      <div>
        <h1 className="font-heading text-4xl font-bold uppercase tracking-tight">Deception Layer</h1>
        <p className="text-muted-foreground mt-2">AI-generated honeypots and decoy devices for threat intelligence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-border/50 border-primary/30 neon-glow">
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Active Honeypots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Total Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-foreground">{stats.interactions}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Threats Caught</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-green-500">{Math.floor(stats.interactions * 0.3)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-border/50 border-primary/30">
        <CardHeader>
          <CardTitle className="font-heading text-xl uppercase tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Active Honeypot Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {honeypots.map((honeypot) => (
              <div 
                key={honeypot.id} 
                className="p-6 rounded-sm bg-primary/5 border border-primary/30"
                data-testid="honeypot-card"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-mono text-lg font-semibold text-primary">{honeypot.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{honeypot.device_type}</p>
                  </div>
                  <Target className="w-6 h-6 text-primary" />
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">IP Address</p>
                      <p className="font-mono text-sm mt-1">{honeypot.ip_address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">MAC Address</p>
                      <p className="font-mono text-sm mt-1">{honeypot.mac_address}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Open Ports</p>
                    <div className="flex gap-2 mt-2">
                      {honeypot.open_ports.map((port, idx) => (
                        <Badge key={idx} className="bg-primary/20 text-primary border-primary/30 font-mono">
                          {port}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Protocols</p>
                    <div className="flex gap-2 mt-2">
                      {honeypot.protocols.map((protocol, idx) => (
                        <Badge key={idx} className="bg-accent border-border font-mono text-xs">
                          {protocol}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground uppercase">Status</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-mono text-xs text-green-500 uppercase">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="font-heading text-xl uppercase tracking-tight">Recent Attacker Interactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-sm bg-accent/30 border border-border/30"
                data-testid="interaction-log"
              >
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-sm font-medium">Connection Attempt</p>
                      <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 60)} mins ago</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Source: {`${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: {honeypots[Math.floor(Math.random() * honeypots.length)]?.name || 'Honeypot 1'} 
                      • Port {[80, 443, 8080, 554][Math.floor(Math.random() * 4)]}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}