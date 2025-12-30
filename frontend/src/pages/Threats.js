import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Shield, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Threats() {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchThreats = async () => {
    try {
      const response = await axios.get(`${API}/threats`);
      setThreats(response.data);
    } catch (error) {
      toast.error('Failed to fetch threats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreats();
  }, []);

  const mitigateThreat = async (threatId, action) => {
    try {
      await axios.post(`${API}/threats/${threatId}/mitigate`, null, {
        params: { action }
      });
      toast.success('Threat mitigated successfully');
      fetchThreats();
    } catch (error) {
      toast.error('Failed to mitigate threat');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-destructive border-destructive/30 bg-destructive/10';
      case 'high': return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'medium': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      default: return 'text-green-500 border-green-500/30 bg-green-500/10';
    }
  };

  return (
    <div className="space-y-8" data-testid="threats-page">
      <div>
        <h1 className="font-heading text-4xl font-bold uppercase tracking-tight">Threat Intelligence</h1>
        <p className="text-muted-foreground mt-2">Real-time detection and response to security threats</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Total Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-primary">{threats.length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-destructive">
              {threats.filter(t => !t.mitigated).length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Mitigated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-green-500">
              {threats.filter(t => t.mitigated).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {threats.length === 0 ? (
          <Card className="glass-card border-border/50">
            <CardContent className="py-12 text-center">
              <Shield className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-heading uppercase">No Active Threats</p>
              <p className="text-sm text-muted-foreground mt-2">Your network is secure</p>
            </CardContent>
          </Card>
        ) : (
          threats.map((threat) => (
            <Card 
              key={threat.id} 
              className={`glass-card border-border/50 ${
                !threat.mitigated ? 'border-destructive/30' : 'border-green-500/30'
              }`}
              data-testid="threat-card"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="font-mono text-xl font-semibold">{threat.threat_type}</CardTitle>
                      <Badge className={`${getSeverityColor(threat.severity)} font-mono uppercase text-[10px]`}>
                        {threat.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{threat.description}</p>
                  </div>
                  {threat.mitigated ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Detected:</span>
                      <span className="ml-2 font-mono">{new Date(threat.timestamp).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Device ID:</span>
                      <span className="ml-2 font-mono text-xs">{threat.device_id.substring(0, 8)}...</span>
                    </div>
                  </div>

                  {threat.mitigated ? (
                    <div className="p-4 rounded-sm bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-mono text-sm uppercase">Threat Mitigated</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Action: {threat.mitigation_action}</p>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => mitigateThreat(threat.id, 'Device Isolated')}
                        variant="destructive"
                        size="sm"
                        className="font-mono uppercase tracking-wider"
                        data-testid="isolate-threat-btn"
                      >
                        Isolate Device
                      </Button>
                      <Button
                        onClick={() => mitigateThreat(threat.id, 'Traffic Blocked')}
                        variant="outline"
                        size="sm"
                        className="font-mono uppercase tracking-wider"
                        data-testid="block-traffic-btn"
                      >
                        Block Traffic
                      </Button>
                      <Button
                        onClick={() => mitigateThreat(threat.id, 'Monitoring')}
                        variant="outline"
                        size="sm"
                        className="font-mono uppercase tracking-wider"
                        data-testid="monitor-btn"
                      >
                        Monitor Only
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}