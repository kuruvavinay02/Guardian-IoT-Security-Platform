import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cpu, Activity, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Agents() {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await axios.get(`${API}/agents`);
      setAgents(response.data);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'text-green-500' : 'text-yellow-500';
  };

  const getAgentIcon = (name) => {
    const icons = {
      'Discovery Agent': '🔍',
      'Behavior Analysis Agent': '📊',
      'Risk Assessment Agent': '⚠️',
      'Deception Agent': '🎭',
      'Response & Mitigation Agent': '🛡️'
    };
    return icons[name] || '🤖';
  };

  return (
    <div className="space-y-8" data-testid="agents-page">
      <div>
        <h1 className="font-heading text-4xl font-bold uppercase tracking-tight">AI Agents</h1>
        <p className="text-muted-foreground mt-2">Autonomous multi-agent security system with independent reasoning</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-primary">{agents.length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-green-500">
              {agents.filter(a => a.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-foreground">
              {agents.length > 0 
                ? Math.round((agents.reduce((sum, a) => sum + a.confidence, 0) / agents.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <Card 
            key={agent.id} 
            className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300"
            data-testid="agent-card"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getAgentIcon(agent.name)}</span>
                  <div>
                    <CardTitle className="font-heading text-xl uppercase tracking-tight">{agent.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                      }`} />
                      <span className={`font-mono text-xs uppercase ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                    </div>
                  </div>
                </div>
                <Cpu className="w-6 h-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Confidence Level</span>
                    <span className="font-mono text-sm font-medium">{Math.round(agent.confidence * 100)}%</span>
                  </div>
                  <Progress value={agent.confidence * 100} className="h-2" />
                </div>

                <div className="p-4 rounded-sm bg-accent/30 border border-border/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Last Action</p>
                  <p className="text-sm">{agent.last_action}</p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Updated {new Date(agent.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card border-border/50 border-primary/30">
        <CardHeader>
          <CardTitle className="font-heading text-xl uppercase tracking-tight">Agent Collaboration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The multi-agent system operates autonomously with each agent specializing in a specific security domain.
              Agents share intelligence and collaborate to provide comprehensive threat detection and response.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-sm bg-accent/30 border border-border/30">
                <h4 className="font-mono text-sm font-medium mb-2">Independent Reasoning</h4>
                <p className="text-xs text-muted-foreground">
                  Each agent makes autonomous decisions based on its specialized knowledge and real-time data analysis.
                </p>
              </div>
              <div className="p-4 rounded-sm bg-accent/30 border border-border/30">
                <h4 className="font-mono text-sm font-medium mb-2">Explainable AI</h4>
                <p className="text-xs text-muted-foreground">
                  All agent decisions include confidence scores and plain-language explanations for transparency.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}