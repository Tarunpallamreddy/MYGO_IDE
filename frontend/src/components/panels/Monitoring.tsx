import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Cpu, HardDrive, Network, RefreshCw } from 'lucide-react';

interface MetricData {
  time: string;
  cpu: number;
  memory: number;
  networkUp: number;
  networkDown: number;
}

export default function Monitoring() {
  const [data, setData] = useState<MetricData[]>([]);
  const [currentCpu, setCurrentCpu] = useState(24);
  const [currentMem, setCurrentMem] = useState(4.2); // GB
  const [currentNetDown, setCurrentNetDown] = useState(1.4); // MB/s
  const [diskUsage, setDiskUsage] = useState(48); // %

  useEffect(() => {
    // Generate initial history
    const initialData: MetricData[] = [];
    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      initialData.push({
        time: timeStr,
        cpu: Math.floor(Math.random() * 30) + 15,
        memory: 4.0 + parseFloat((Math.random() * 0.4).toFixed(2)),
        networkUp: Math.floor(Math.random() * 200) + 50,
        networkDown: Math.floor(Math.random() * 800) + 200
      });
    }
    setData(initialData);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const newCpu = Math.floor(Math.random() * 45) + 10;
      const newMem = parseFloat((3.9 + Math.random() * 0.6).toFixed(2));
      const newNetUp = Math.floor(Math.random() * 300) + 40;
      const newNetDown = Math.floor(Math.random() * 950) + 100;
      
      setCurrentCpu(newCpu);
      setCurrentMem(newMem);
      setCurrentNetDown(parseFloat((newNetDown / 100).toFixed(1)));
      
      setData(prev => {
        const next = [...prev.slice(1), {
          time: timeStr,
          cpu: newCpu,
          memory: newMem,
          networkUp: newNetUp,
          networkDown: newNetDown
        }];
        return next;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-full bg-bg-secondary text-text-main overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border-color flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold tracking-wider text-text-muted uppercase flex items-center gap-1.5">
            <Activity size={14} className="text-accent-cyan animate-pulse" />
            <span>Workspace Metrics</span>
          </h3>
          <span className="text-[9px] text-text-muted mt-0.5 block">Live system telemetry</span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1">
        
        {/* Core Stat Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-bg-primary p-2.5 rounded border border-border-color flex flex-col justify-between">
            <span className="text-text-muted flex items-center gap-1 text-[10px] font-bold">
              <Cpu size={12} className="text-accent-cyan" /> CPU Load
            </span>
            <span className="text-lg font-bold mt-1 text-text-main">{currentCpu}%</span>
          </div>
          <div className="bg-bg-primary p-2.5 rounded border border-border-color flex flex-col justify-between">
            <span className="text-text-muted flex items-center gap-1 text-[10px] font-bold">
              <HardDrive size={12} className="text-accent-violet" /> RAM Usage
            </span>
            <span className="text-lg font-bold mt-1 text-text-main">{currentMem} GB <span className="text-[10px] font-normal text-text-muted">/ 8GB</span></span>
          </div>
        </div>

        {/* CPU Chart */}
        <div className="bg-bg-primary border border-border-color rounded-lg p-3">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex justify-between items-center">
            <span>CPU Utilization Timeline</span>
            <span className="text-accent-cyan bg-accent-cyan/10 px-1 py-0.2 rounded font-mono text-[9px]">{currentCpu}%</span>
          </div>
          <div className="h-[90px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip contentStyle={{ background: '#10141d', borderColor: '#222b3c', fontSize: '9px' }} />
                <Area type="monotone" dataKey="cpu" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCpu)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Chart */}
        <div className="bg-bg-primary border border-border-color rounded-lg p-3">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex justify-between items-center">
            <span>Memory Allocations (GB)</span>
            <span className="text-accent-violet bg-accent-violet/10 px-1 py-0.2 rounded font-mono text-[9px]">{currentMem} GB</span>
          </div>
          <div className="h-[90px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 8]} hide />
                <Tooltip contentStyle={{ background: '#10141d', borderColor: '#222b3c', fontSize: '9px' }} />
                <Bar dataKey="memory" fill="#8b5cf6" radius={[2, 2, 0, 0]} maxBarSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network and Disk */}
        <div className="bg-bg-primary border border-border-color rounded-lg p-3 flex flex-col gap-3">
          {/* Network Activity */}
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1"><Network size={12} className="text-accent-green" /> Network Bandwidth</span>
              <span className="text-[9px] font-mono text-text-main">{currentNetDown} MB/s down</span>
            </div>
            <div className="flex gap-2 justify-between items-center text-[10px] font-mono border-t border-border-color/30 pt-1.5">
              <span className="text-text-muted">Outgoing Rate: {data[data.length - 1]?.networkUp} Kb/s</span>
              <span className="text-text-muted">Incoming Rate: {data[data.length - 1]?.networkDown} Kb/s</span>
            </div>
          </div>

          {/* Disk space */}
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Disk Space Utilization</span>
              <span className="text-[9px] font-mono text-text-main">{diskUsage}%</span>
            </div>
            <div className="w-full bg-bg-secondary h-2 border border-border-color rounded-full overflow-hidden">
              <div className="bg-accent-violet h-full rounded-full transition-all duration-500" style={{ width: `${diskUsage}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-text-muted font-mono mt-1">
              <span>Used: 57.6 GB</span>
              <span>Total capacity: 120 GB</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
