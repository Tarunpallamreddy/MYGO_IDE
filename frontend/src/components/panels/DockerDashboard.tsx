import React, { useState } from 'react';
import { Play, Square, RefreshCw, Layers, HardDrive, List, FileText, Database, Send } from 'lucide-react';

interface Container {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'exited';
  cpu: string;
  mem: string;
  ports: string;
}

export default function DockerDashboard() {
  const [containers, setContainers] = useState<Container[]>([
    { id: 'ab79e390c12e', name: 'postgres-db', image: 'postgres:15-alpine', status: 'running', cpu: '1.2%', mem: '45MiB / 8GiB', ports: '5432:5432' },
    { id: 'cf32910fae1b', name: 'redis-cache', image: 'redis:7-alpine', status: 'running', cpu: '0.4%', mem: '12MiB / 8GiB', ports: '6379:6379' },
    { id: '1288f3ba219a', name: 'ollama-llm', image: 'ollama/ollama:latest', status: 'exited', cpu: '0%', mem: '0B / 8GiB', ports: '11434:11434' },
  ]);
  const [images] = useState([
    { repository: 'node', tag: '18-alpine', id: 'cd23a9a1', size: '174 MB' },
    { repository: 'postgres', tag: '15-alpine', id: 'a2b10ca3', size: '240 MB' },
    { repository: 'redis', tag: '7-alpine', id: 'f72da01b', size: '32 MB' },
    { repository: 'ollama/ollama', tag: 'latest', id: 'd7920ab4', size: '1.8 GB' }
  ]);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeLogContainer, setActiveLogContainer] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] docker: ${msg}`, ...prev.slice(0, 19)]);
  };

  const toggleContainer = (id: string) => {
    setContainers(containers.map(c => {
      if (c.id === id) {
        const running = c.status === 'running';
        const nextStatus = running ? 'exited' : 'running';
        addLog(`Container ${c.name} status updated to: ${nextStatus.toUpperCase()}`);
        return {
          ...c,
          status: nextStatus,
          cpu: running ? '0%' : '0.8%',
          mem: running ? '0B / 8GiB' : '22MiB / 8GiB'
        };
      }
      return c;
    }));
  };

  const triggerDockerCompose = () => {
    addLog("Running 'docker compose up -d'...");
    setTimeout(() => {
      addLog("Recreating postgres-db ... Done");
      addLog("Recreating redis-cache ... Done");
      addLog("Starting containers in background.");
      setContainers(prev => prev.map(c => ({
        ...c,
        status: 'running',
        cpu: '1.0%',
        mem: '32MiB / 8GiB'
      })));
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary text-text-main overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border-color flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold tracking-wider text-text-muted uppercase">Docker Management</h3>
          <span className="text-[10px] text-accent-green bg-accent-green/10 px-2 py-0.5 rounded border border-accent-green/30 mt-1 inline-block">Daemon active</span>
        </div>
        <button 
          onClick={triggerDockerCompose}
          className="flex items-center gap-1 text-[10px] bg-accent-violet hover:bg-opacity-80 px-2.5 py-1 rounded text-white font-medium transition"
        >
          <Play size={10} /> Compose Up
        </button>
      </div>

      {/* Containers */}
      <div className="p-4 flex flex-col gap-5 flex-1">
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <List size={13} className="text-accent-cyan" />
            <span>Active Containers</span>
          </h4>
          <div className="flex flex-col gap-2">
            {containers.map(c => (
              <div key={c.id} className="bg-bg-primary border border-border-color rounded p-2.5 hover:border-text-muted transition">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-semibold text-text-main flex items-center gap-2">
                      {c.name}
                      <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'running' ? 'bg-accent-green shadow-[0_0_6px_#10b981]' : 'bg-accent-red'}`} />
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">{c.image} • {c.ports}</div>
                    {c.status === 'running' && (
                      <div className="flex gap-2 text-[9px] text-text-muted mt-1 font-mono">
                        <span>CPU: {c.cpu}</span>
                        <span>MEM: {c.mem}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => toggleContainer(c.id)}
                      className="p-1 rounded bg-bg-secondary hover:bg-border-color text-text-muted hover:text-text-main transition"
                    >
                      {c.status === 'running' ? <Square size={11} className="text-accent-red" /> : <Play size={11} className="text-accent-green" />}
                    </button>
                    <button 
                      onClick={() => {
                        setActiveLogContainer(c.name);
                        addLog(`Attached console session standard streams for container: ${c.name}`);
                      }}
                      className="p-1 rounded bg-bg-secondary hover:bg-border-color text-text-muted hover:text-text-main transition"
                      title="View Logs"
                    >
                      <FileText size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Images List */}
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HardDrive size={13} className="text-accent-violet" />
            <span>Local Docker Images</span>
          </h4>
          <div className="bg-bg-primary border border-border-color rounded divide-y divide-border-color">
            {images.map(img => (
              <div key={img.id} className="p-2 text-xs flex justify-between items-center hover:bg-bg-secondary/40">
                <div>
                  <span className="font-semibold text-text-main">{img.repository}</span>
                  <span className="text-[10px] text-text-muted ml-1.5">:{img.tag}</span>
                </div>
                <div className="text-[10px] text-text-muted font-mono">{img.size}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Logs */}
        <div className="mt-auto border-t border-border-color pt-3">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Docker Engine Output</h4>
            <button 
              onClick={() => setLogs([])}
              className="text-[10px] text-text-muted hover:text-text-main"
            >
              Clear
            </button>
          </div>
          <div className="bg-bg-primary border border-border-color rounded h-[100px] p-2 overflow-y-auto font-mono text-[9px] text-text-muted flex flex-col gap-1">
            {activeLogContainer && (
              <div className="text-accent-cyan border-b border-border-color pb-1 mb-1 font-bold">
                ATTACHED LOGS: {activeLogContainer}
              </div>
            )}
            {logs.length === 0 ? (
              <div className="text-center italic mt-7 text-[9px]">Listening for container runtime logs...</div>
            ) : (
              logs.map((log, i) => <div key={i} className="whitespace-pre-wrap">{log}</div>)
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
