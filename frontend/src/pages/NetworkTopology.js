import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function NetworkTopology() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const graphRef = useRef();

  useEffect(() => {
    fetchTopology();
  }, []);

  const fetchTopology = async () => {
    try {
      const response = await axios.get(`${API}/network-topology`);
      setGraphData(response.data);
    } catch (error) {
      toast.error('Failed to fetch network topology');
    }
  };

  const getNodeColor = (node) => {
    if (node.type === 'router') return '#00f0ff';
    if (node.is_honeypot) return '#00ff9d';
    if (node.status === 'isolated') return '#ffb800';
    if (node.risk >= 70) return '#ff2a6d';
    if (node.risk >= 40) return '#ffb800';
    return '#00ff9d';
  };

  const getNodeSize = (node) => {
    if (node.type === 'router') return 12;
    return 8;
  };

  return (
    <div className="space-y-8" data-testid="topology-page">
      <div>
        <h1 className="font-heading text-4xl font-bold uppercase tracking-tight">Network Topology</h1>
        <p className="text-muted-foreground mt-2">Interactive visualization of your IoT network</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="glass-card border-border/50 h-[600px]">
            <CardHeader>
              <CardTitle className="font-heading text-lg uppercase tracking-tight">Network Graph</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px]">
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeLabel="name"
                nodeColor={getNodeColor}
                nodeRelSize={getNodeSize}
                linkColor={() => '#27272a'}
                linkWidth={2}
                backgroundColor="#050505"
                onNodeClick={(node) => setSelectedNode(node)}
                nodeCanvasObjectMode={() => 'after'}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const label = node.name;
                  const fontSize = 12 / globalScale;
                  ctx.font = `${fontSize}px JetBrains Mono`;
                  ctx.fillStyle = '#a1a1aa';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(label, node.x, node.y + 15);
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg uppercase tracking-tight">Node Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4" data-testid="node-details">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Name</p>
                    <p className="font-mono text-sm mt-1">{selectedNode.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Type</p>
                    <p className="font-mono text-sm mt-1">{selectedNode.type}</p>
                  </div>
                  {selectedNode.type !== 'router' && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                        <p className="font-mono text-sm mt-1">{selectedNode.status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Risk Score</p>
                        <p className="font-mono text-sm mt-1">{selectedNode.risk}</p>
                      </div>
                      {selectedNode.is_honeypot && (
                        <div className="p-3 rounded-sm bg-primary/10 border border-primary/30">
                          <p className="text-xs text-primary font-mono uppercase tracking-wider">
                            Honeypot Device
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Click on a node to view details</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50 mt-6">
            <CardHeader>
              <CardTitle className="font-heading text-lg uppercase tracking-tight">Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#00f0ff' }} />
                  <span className="text-xs font-mono">Router</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#00ff9d' }} />
                  <span className="text-xs font-mono">Low Risk / Honeypot</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ffb800' }} />
                  <span className="text-xs font-mono">Medium Risk</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ff2a6d' }} />
                  <span className="text-xs font-mono">High Risk</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}