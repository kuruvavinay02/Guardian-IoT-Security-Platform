import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, AlertTriangle, Play, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const response = await axios.get(`${API}/incidents`);
      setIncidents(response.data);
      if (response.data.length > 0 && !selectedIncident) {
        setSelectedIncident(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    }
  };

  const generateIncident = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/incidents/generate`);
      toast.success('New incident generated');
      setIncidents([response.data, ...incidents]);
      setSelectedIncident(response.data);
    } catch (error) {
      toast.error('Failed to generate incident');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'high': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-500 border-green-500/30';
    }
  };

  return (
    <div className="space-y-8" data-testid="incidents-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold uppercase tracking-tight">Incident Forensics</h1>
          <p className="text-muted-foreground mt-2">Attack timeline replay and AI-powered explanations</p>
        </div>
        <Button 
          onClick={generateIncident}
          disabled={loading}
          className="font-mono uppercase tracking-wider"
          data-testid="generate-incident-btn"
        >
          <Play className="w-4 h-4 mr-2" />
          {loading ? 'Generating...' : 'Generate Incident'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg uppercase tracking-tight">Incident History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {incidents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No incidents recorded</p>
              ) : (
                incidents.map((incident) => (
                  <button
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className={`w-full text-left p-4 rounded-sm transition-all duration-200 ${
                      selectedIncident?.id === incident.id
                        ? 'bg-primary/10 border border-primary/30 text-primary'
                        : 'bg-accent/30 border border-border/30 hover:border-primary/30'
                    }`}
                    data-testid="incident-item-btn"
                  >
                    <p className="font-mono text-sm font-medium">{incident.attack_type}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(incident.timestamp).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Source: {incident.source_ip}
                    </p>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {selectedIncident ? (
            <>
              <Card className="glass-card border-border/50 border-destructive/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="font-heading text-2xl uppercase tracking-tight">
                        {selectedIncident.attack_type}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        Detected: {new Date(selectedIncident.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Source IP</p>
                        <p className="font-mono text-sm mt-1">{selectedIncident.source_ip}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Target Device</p>
                        <p className="font-mono text-sm mt-1">{selectedIncident.target_device_id.substring(0, 12)}...</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-heading text-xl uppercase tracking-tight">Attack Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedIncident.timeline.map((event, idx) => (
                      <div 
                        key={idx} 
                        className="flex gap-4"
                        data-testid="timeline-event"
                      >
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            event.severity === 'critical' ? 'bg-destructive' :
                            event.severity === 'high' ? 'bg-red-500' :
                            event.severity === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} />
                          {idx < selectedIncident.timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-muted-foreground">{event.time}</span>
                            <Badge className={`${getSeverityColor(event.severity)} text-[10px] font-mono uppercase`}>
                              {event.severity}
                            </Badge>
                          </div>
                          <p className="text-sm mt-2">{event.event}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50 border-primary/30">
                <CardHeader>
                  <CardTitle className="font-heading text-xl uppercase tracking-tight flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    AI Explanation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-sm bg-primary/5 border border-primary/20">
                    <p className="text-sm leading-relaxed">{selectedIncident.explanation}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    This explanation was generated by our AI security analyst to help you understand the attack in plain language.
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="glass-card border-border/50">
              <CardContent className="py-12 text-center">
                <Eye className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-heading uppercase">No Incident Selected</p>
                <p className="text-sm text-muted-foreground mt-2">Select an incident from the history or generate a new one</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}