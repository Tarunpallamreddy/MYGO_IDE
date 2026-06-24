import React, { useState } from 'react';
import { Search, Server, HardDrive, Shield, Cpu, RefreshCw, Layers, DollarSign, Plus, Play, Square, Terminal as LogIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const costData = [
  { name: 'May', cost: 1200 },
  { name: 'Jun', cost: 1540 },
  { name: 'Jul', cost: 1890 },
  { name: 'Aug', cost: 2100 },
  { name: 'Sep', cost: 1950 },
  { name: 'Oct', cost: 2450 },
];

export default function AWSExplorer() {
  const [search, setSearch] = useState('');
  const [instances, setInstances] = useState([
    { id: 'i-0ef32491a', name: 'mygo-api-prod', type: 't3.medium', status: 'running', ip: '54.210.12.89' },
    { id: 'i-09f120aa2', name: 'mygo-web-frontend', type: 't3.small', status: 'running', ip: '34.201.99.102' },
    { id: 'i-044238a8a', name: 'mygo-db-replica', type: 'r5.large', status: 'stopped', ip: '10.0.2.145' },
  ]);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeLogInstance, setActiveLogInstance] = useState<string | null>(null);

  const toggleInstance = (id: string) => {
    setInstances(instances.map(inst => {
      if (inst.id === id) {
        const nextStatus = inst.status === 'running' ? 'stopped' : 'running';
        addLog(`Instance ${inst.name} (${id}) status changed to ${nextStatus.toUpperCase()}`);
        return { ...inst, status: nextStatus };
      }
      return inst;
    }));
  };

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] AWS: ${msg}`, ...prev.slice(0, 19)]);
  };

  const createInstance = () => {
    const newId = `i-0${Math.random().toString(16).substring(2, 10)}`;
    const newInst = {
      id: newId,
      name: `mygo-worker-sim-${instances.length + 1}`,
      type: 't3.micro',
      status: 'running',
      ip: `54.192.12.${Math.floor(Math.random() * 254) + 1}`
    };
    setInstances([...instances, newInst]);
    addLog(`Successfully provisioned new EC2 instance: ${newInst.name} (${newId})`);
  };

  const filteredInstances = instances.filter(inst => 
    inst.name.toLowerCase().includes(search.toLowerCase()) || inst.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-bg-secondary text-text-main overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border-color flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold tracking-wider text-text-muted uppercase">AWS Cloud Explorer</h3>
          <span className="text-[10px] text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded border border-accent-cyan/30 mt-1 inline-block">Connected to us-east-1</span>
        </div>
        <button 
          onClick={createInstance}
          className="flex items-center gap-1 text-[11px] bg-accent-violet hover:bg-opacity-80 px-2.5 py-1 rounded text-white font-medium transition"
        >
          <Plus size={12} /> Provision
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border-color">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search EC2, S3, RDS..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-bg-primary border border-border-color rounded py-1.5 pl-8 pr-3 text-xs outline-none focus:border-border-focus text-text-main"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex flex-col gap-5 flex-1">
        
        {/* Cost Estimation Widget */}
        <div className="bg-bg-primary rounded-lg border border-border-color p-3 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-text-muted">
            <DollarSign size={14} className="text-accent-yellow" />
            <span>Monthly Cost Estimate</span>
          </div>
          <div className="text-xl font-bold text-text-main mb-3">$2,105.40 <span className="text-[11px] font-normal text-accent-green">+4.2% from last month</span></div>
          <div className="h-[70px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costData}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ background: '#10141d', borderColor: '#222b3c', fontSize: '10px' }} />
                <Area type="monotone" dataKey="cost" stroke="#8b5cf6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* EC2 Instances List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Server size={13} className="text-accent-cyan" />
              <span>EC2 Instances ({instances.length})</span>
            </h4>
          </div>
          
          <div className="flex flex-col gap-2">
            {filteredInstances.map(inst => (
              <div key={inst.id} className="bg-bg-primary border border-border-color rounded p-2.5 hover:border-text-muted transition">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-medium text-text-main flex items-center gap-2">
                      {inst.name}
                      <span className={`w-1.5 h-1.5 rounded-full ${inst.status === 'running' ? 'bg-accent-green shadow-[0_0_8px_#10b981]' : 'bg-accent-red'}`} />
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">{inst.id} • {inst.type} • {inst.ip}</div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => toggleInstance(inst.id)}
                      title={inst.status === 'running' ? 'Stop Instance' : 'Start Instance'}
                      className="p-1 rounded bg-bg-secondary hover:bg-border-color text-text-muted hover:text-text-main transition"
                    >
                      {inst.status === 'running' ? <Square size={11} className="text-accent-red" /> : <Play size={11} className="text-accent-green" />}
                    </button>
                    <button 
                      onClick={() => {
                        setActiveLogInstance(inst.name);
                        addLog(`Requested CloudWatch console logs for EC2 ${inst.name}`);
                      }}
                      title="Console Logs"
                      className="p-1 rounded bg-bg-secondary hover:bg-border-color text-text-muted hover:text-text-main transition"
                    >
                      <LogIcon size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* S3 Buckets */}
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HardDrive size={13} className="text-accent-violet" />
            <span>S3 Buckets</span>
          </h4>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between p-2 bg-bg-primary border border-border-color rounded">
              <span className="font-mono text-xs">mygo-ide-assets-bucket</span>
              <span className="text-[10px] text-text-muted">Private • 1.2 GB</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-bg-primary border border-border-color rounded">
              <span className="font-mono text-xs">mygo-prod-backups</span>
              <span className="text-[10px] text-text-muted">Encrypted • 14.5 GB</span>
            </div>
          </div>
        </div>

        {/* Serverless Lambda */}
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Cpu size={13} className="text-accent-green" />
            <span>Lambda Functions</span>
          </h4>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="p-2 bg-bg-primary border border-border-color rounded flex justify-between items-center">
              <div>
                <div className="font-mono text-xs">auth-token-verifier</div>
                <div className="text-[10px] text-text-muted">NodeJS 18.x • Active</div>
              </div>
              <button 
                onClick={() => addLog("Triggered test invocation on Lambda auth-token-verifier")}
                className="text-[10px] bg-bg-secondary border border-border-color px-2 py-0.5 rounded hover:border-text-muted text-text-main"
              >
                Invoke
              </button>
            </div>
          </div>
        </div>

        {/* CloudWatch Logs */}
        <div className="mt-auto border-t border-border-color pt-3">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">CloudWatch Log Stream</h4>
            <button 
              onClick={() => setLogs([])}
              className="text-[10px] text-text-muted hover:text-text-main"
            >
              Clear
            </button>
          </div>
          <div className="bg-bg-primary border border-border-color rounded h-[120px] p-2 overflow-y-auto font-mono text-[10px] text-text-muted flex flex-col gap-1">
            {activeLogInstance && (
              <div className="text-accent-cyan border-b border-border-color pb-1 mb-1 font-bold">
                LOGS: {activeLogInstance}
              </div>
            )}
            {logs.length === 0 ? (
              <div className="text-center italic mt-8 text-[9px]">No recent CloudWatch streams.</div>
            ) : (
              logs.map((log, i) => <div key={i} className="whitespace-pre-wrap">{log}</div>)
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
