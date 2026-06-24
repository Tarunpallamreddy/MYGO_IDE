import React, { useState, useEffect } from 'react';
import { Layers, Activity, Server, FileCode, Play, Trash2, RefreshCw, Send, AlertTriangle } from 'lucide-react';

interface Pod {
  name: string;
  status: 'Running' | 'Pending' | 'Terminating' | 'CrashLoopBackOff';
  restarts: number;
  age: string;
  cpu: string;
  memory: string;
}

export default function K8sExplorer() {
  const [namespace, setNamespace] = useState('default');
  const [pods, setPods] = useState<Pod[]>([
    { name: 'mygo-api-deploy-79fbb9-2z9d2', status: 'Running', restarts: 0, age: '2h', cpu: '45m', memory: '182Mi' },
    { name: 'mygo-api-deploy-79fbb9-g4n67', status: 'Running', restarts: 1, age: '2h', cpu: '52m', memory: '190Mi' },
    { name: 'mygo-web-deploy-5cb6bc-x9v88', status: 'Running', restarts: 0, age: '4d', cpu: '12m', memory: '98Mi' },
    { name: 'redis-cache-0', status: 'Running', restarts: 0, age: '6d', cpu: '8m', memory: '45Mi' },
  ]);
  const [k8sLogs, setK8sLogs] = useState<string[]>([]);
  const [yamlContent, setYamlContent] = useState(`apiVersion: apps/v1
kind: Deployment
metadata:
  name: mygo-worker
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: worker
        image: mygo-worker:latest`);

  const addLog = (msg: string) => {
    setK8sLogs(prev => [`[${new Date().toLocaleTimeString()}] k8s: ${msg}`, ...prev.slice(0, 19)]);
  };

  const deletePod = (name: string) => {
    setPods(prev => prev.map(p => p.name === name ? { ...p, status: 'Terminating' as const } : p));
    addLog(`Initiated pod deletion for ${name}`);
    
    // Simulate pod recreation
    setTimeout(() => {
      setPods(prev => {
        const filtered = prev.filter(p => p.name !== name);
        if (name.includes('deploy')) {
          const suffix = Math.random().toString(36).substring(2, 7);
          const base = name.split('-').slice(0, -1).join('-');
          const newPod: Pod = {
            name: `${base}-${suffix}`,
            status: 'Pending',
            restarts: 0,
            age: '1s',
            cpu: '0m',
            memory: '10Mi'
          };
          
          addLog(`ReplicaSet controller created pod: ${newPod.name}`);
          
          // Move from pending to running
          setTimeout(() => {
            setPods(pList => pList.map(p => p.name === newPod.name ? { ...p, status: 'Running', cpu: '20m', memory: '120Mi' } : p));
            addLog(`Pod ${newPod.name} entered state: Running`);
          }, 3000);

          return [...filtered, newPod];
        }
        return filtered;
      });
    }, 2000);
  };

  const applyDeployment = () => {
    addLog("Applying Deployment manifest via kubectl client...");
    
    // Extract replicas count from text
    const match = yamlContent.match(/replicas:\s*(\d+)/);
    const count = match ? parseInt(match[1]) : 1;
    
    // Extract deployment name
    const nameMatch = yamlContent.match(/name:\s*([a-zA-Z0-9-]+)/);
    const deployName = nameMatch ? nameMatch[1] : 'mygo-custom';
    
    addLog(`Configured scale for ${deployName}: desired replicas = ${count}`);
    
    // Create new pods representing deployment
    const newPods: Pod[] = [];
    for (let i = 0; i < count; i++) {
      const suffix = Math.random().toString(36).substring(2, 7);
      newPods.push({
        name: `${deployName}-${suffix}`,
        status: 'Pending',
        restarts: 0,
        age: '1s',
        cpu: '0m',
        memory: '15Mi'
      });
    }

    setPods(prev => {
      // Remove old pods of same deployment
      const cleaned = prev.filter(p => !p.name.startsWith(deployName));
      return [...cleaned, ...newPods];
    });

    // Make pods enter running state
    newPods.forEach(np => {
      setTimeout(() => {
        setPods(pList => pList.map(p => p.name === np.name ? { ...p, status: 'Running', cpu: '28m', memory: '135Mi' } : p));
        addLog(`Pod ${np.name} entered state: Running`);
      }, 4000);
    });
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary text-text-main overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border-color">
        <h3 className="text-xs font-bold tracking-wider text-text-muted uppercase mb-2">Kubernetes Dashboard</h3>
        <div className="flex gap-2 items-center">
          <span className="text-[10px] text-text-muted font-semibold">Namespace:</span>
          <select 
            value={namespace}
            onChange={e => setNamespace(e.target.value)}
            className="bg-bg-primary border border-border-color text-text-main text-[11px] rounded px-2 py-1 outline-none focus:border-border-focus"
          >
            <option value="default">default</option>
            <option value="kube-system">kube-system</option>
            <option value="production">production</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-2 p-3 bg-bg-primary/50 border-b border-border-color">
        <div className="bg-bg-primary p-2 rounded border border-border-color flex items-center justify-between">
          <div>
            <div className="text-[10px] text-text-muted font-bold">Active Pods</div>
            <div className="text-lg font-bold text-accent-green">{pods.filter(p => p.status === 'Running').length} <span className="text-[10px] text-text-muted">/ {pods.length}</span></div>
          </div>
          <Activity size={18} className="text-accent-green" />
        </div>
        <div className="bg-bg-primary p-2 rounded border border-border-color flex items-center justify-between">
          <div>
            <div className="text-[10px] text-text-muted font-bold">Diagnostics</div>
            <div className="text-sm font-bold text-accent-yellow">Healthy</div>
          </div>
          <Server size={18} className="text-accent-yellow" />
        </div>
      </div>

      {/* Pod List */}
      <div className="p-4 flex flex-col gap-4 flex-1">
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers size={13} className="text-accent-cyan" />
            <span>Pods List</span>
          </h4>
          <div className="flex flex-col gap-2">
            {pods.map(pod => (
              <div key={pod.name} className="bg-bg-primary border border-border-color rounded p-2.5 hover:border-text-muted transition">
                <div className="flex justify-between items-start">
                  <div className="max-w-[70%]">
                    <div className="text-[11px] font-mono text-text-main truncate" title={pod.name}>{pod.name}</div>
                    <div className="flex gap-2 text-[9px] text-text-muted mt-1 font-semibold">
                      <span>Restarts: {pod.restarts}</span>
                      <span>•</span>
                      <span>Age: {pod.age}</span>
                      <span>•</span>
                      <span>CPU: {pod.cpu}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                      pod.status === 'Running' ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' :
                      pod.status === 'Pending' ? 'bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20' :
                      'bg-accent-red/10 text-accent-red border border-accent-red/20'
                    }`}>
                      {pod.status}
                    </span>
                    <button 
                      onClick={() => deletePod(pod.name)}
                      title="Terminate Pod"
                      className="p-1 rounded hover:bg-border-color text-text-muted hover:text-accent-red transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Declarative Deployer */}
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileCode size={13} className="text-accent-violet" />
            <span>Declarative Deployer (manifest)</span>
          </h4>
          <div className="border border-border-color rounded overflow-hidden">
            <textarea 
              value={yamlContent}
              onChange={e => setYamlContent(e.target.value)}
              spellCheck="false"
              className="w-full h-[120px] bg-bg-primary text-text-main font-mono text-[10px] p-2 resize-none outline-none"
            />
            <div className="bg-bg-secondary p-1.5 border-t border-border-color flex justify-between items-center">
              <span className="text-[9px] text-text-muted font-mono">kubectl apply -f manifest.yaml</span>
              <button 
                onClick={applyDeployment}
                className="flex items-center gap-1 text-[10px] bg-accent-violet text-white px-2 py-0.5 rounded font-medium hover:bg-opacity-80 transition"
              >
                <Send size={10} /> Deploy
              </button>
            </div>
          </div>
        </div>

        {/* Events / Logs */}
        <div className="mt-auto border-t border-border-color pt-3">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Kubernetes API Events</h4>
            <button 
              onClick={() => setK8sLogs([])}
              className="text-[10px] text-text-muted hover:text-text-main"
            >
              Clear
            </button>
          </div>
          <div className="bg-bg-primary border border-border-color rounded h-[100px] p-2 overflow-y-auto font-mono text-[9px] text-text-muted flex flex-col gap-1">
            {k8sLogs.length === 0 ? (
              <div className="text-center italic mt-7 text-[9px]">Listening for API cluster events...</div>
            ) : (
              k8sLogs.map((log, i) => <div key={i} className="whitespace-pre-wrap">{log}</div>)
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
