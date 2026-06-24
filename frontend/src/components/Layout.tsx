import { useState } from 'react';
import { 
  FolderOpen, GitBranch, Server, Layers, Cpu, Database, 
  Activity, ShieldCheck, Package, Play, Sun, Moon, Sparkles, 
  AlertTriangle, ChevronDown, Settings, LogOut, PanelRightClose, 
  PanelRight, ChevronUp, UserCheck
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  setSelectedPanel, closeFile, setActiveFile, toggleAISidebar, 
  updateSettings, setUser, setToken 
} from '../store/workspaceSlice';

// Side panels import
import ExplorerPanel from './panels/ExplorerPanel';
import GitExplorer from './panels/GitExplorer';
import AWSExplorer from './panels/AWSExplorer';
import K8sExplorer from './panels/K8sExplorer';
import DockerDashboard from './panels/DockerDashboard';
import DBExplorer from './panels/DBExplorer';
import Monitoring from './panels/Monitoring';
import SecurityCenter from './panels/SecurityCenter';
import DevOpsDashboard from './panels/DevOpsDashboard';
import AIPanel from './panels/AIPanel';

// Monaco & Terminal imports
import MonacoEditor from './MonacoEditor';
import Terminal from './Terminal';

export default function Layout() {
  const dispatch = useAppDispatch();
  const state = useAppSelector(state => state.workspace);
  
  // Console panel drawer states
  const [consoleDrawerOpen, setConsoleDrawerOpen] = useState(true);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'terminal' | 'output' | 'problems' | 'debug'>('terminal');
  const [drawerHeight, setDrawerHeight] = useState(240);
  const [isDragging, setIsDragging] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);



  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const startY = e.clientY;
    const startHeight = drawerHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(32, Math.min(window.innerHeight * 0.8, startHeight - deltaY));
      setDrawerHeight(newHeight);
      if (newHeight > 35) {
        setConsoleDrawerOpen(true);
      } else {
        setConsoleDrawerOpen(false);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Editor cursor coordinates
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [outputLogs, setOutputLogs] = useState<string[]>([
    "System: MYGO Cloud compiler toolchains loaded successfully.",
    "System: Local dev server watching folders in workspace root."
  ]);

  const handleRunCode = () => {
    // Simulate compilation output
    const timestamp = new Date().toLocaleTimeString();
    setOutputLogs(prev => [
      ...prev,
      `[${timestamp}] Compilation started for active context...`,
      `[${timestamp}] Found active file: ${state.activeFile || 'None'}`,
      `[${timestamp}] Executing pre-build steps...`,
      `[${timestamp}] Output generated successfully. Code exit status 0`
    ]);
    setActiveConsoleTab('output');
    setConsoleDrawerOpen(true);
  };

  const handleLogout = () => {
    dispatch(setUser(null));
    dispatch(setToken(null));
  };

  const toggleTheme = () => {
    const nextTheme = state.settings.theme === 'dark-theme' ? 'light-theme' : 'dark-theme';
    dispatch(updateSettings({ theme: nextTheme }));
  };

  const menus = [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New Text File', shortcut: 'Ctrl+N', action: () => dispatch(setSelectedPanel('explorer')) },
        { label: 'New File...', shortcut: 'Ctrl+Alt+Win+N', action: () => dispatch(setSelectedPanel('explorer')) },
        { label: 'Open File...', shortcut: 'Ctrl+O', action: () => dispatch(setSelectedPanel('explorer')) },
        { label: 'Save', shortcut: 'Ctrl+S', action: () => {
          if (state.activeFile) {
            setOutputLogs(prev => [...prev, `[System] Saved active file: ${state.activeFile}`]);
          }
        }},
        { label: 'Auto Save', shortcut: 'Auto', action: () => {} },
        { label: 'Preferences', action: toggleTheme },
        { label: 'Close Editor', shortcut: 'Ctrl+F4', action: () => {
          if (state.activeFile) dispatch(closeFile(state.activeFile));
        }},
        { label: 'Exit', action: handleLogout }
      ]
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z' },
        { label: 'Redo', shortcut: 'Ctrl+Y' },
        { label: 'Cut', shortcut: 'Ctrl+X' },
        { label: 'Copy', shortcut: 'Ctrl+C' },
        { label: 'Paste', shortcut: 'Ctrl+V' },
        { label: 'Find', shortcut: 'Ctrl+F' },
        { label: 'Replace', shortcut: 'Ctrl+H' }
      ]
    },
    {
      id: 'selection',
      label: 'Selection',
      items: [
        { label: 'Select All', shortcut: 'Ctrl+A' },
        { label: 'Expand Selection', shortcut: 'Shift+Alt+Right' },
        { label: 'Shrink Selection', shortcut: 'Shift+Alt+Left' },
        { label: 'Copy Line Up', shortcut: 'Shift+Alt+Up' },
        { label: 'Copy Line Down', shortcut: 'Shift+Alt+Down' },
        { label: 'Move Line Up', shortcut: 'Alt+Up' },
        { label: 'Move Line Down', shortcut: 'Alt+Down' }
      ]
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: () => dispatch(setSelectedPanel('explorer')) },
        { label: 'Search', shortcut: 'Ctrl+Shift+F', action: () => dispatch(setSelectedPanel('explorer')) },
        { label: 'Source Control', shortcut: 'Ctrl+Shift+G', action: () => dispatch(setSelectedPanel('git')) },
        { label: 'Docker Dashboard', shortcut: 'Ctrl+Shift+D', action: () => dispatch(setSelectedPanel('docker')) },
        { label: 'AWS Explorer', action: () => dispatch(setSelectedPanel('aws')) },
        { label: 'Database Explorer', action: () => dispatch(setSelectedPanel('db')) },
        { label: 'Problems', shortcut: 'Ctrl+Shift+M', action: () => {
          setActiveConsoleTab('problems');
          setConsoleDrawerOpen(true);
        }},
        { label: 'Output', shortcut: 'Ctrl+Shift+U', action: () => {
          setActiveConsoleTab('output');
          setConsoleDrawerOpen(true);
        }},
        { label: 'Terminal', shortcut: 'Ctrl+`', action: () => {
          setActiveConsoleTab('terminal');
          setConsoleDrawerOpen(true);
        }},
        { label: 'Word Wrap', shortcut: 'Alt+Z' }
      ]
    },
    {
      id: 'go',
      label: 'Go',
      items: [
        { label: 'Go to File...', shortcut: 'Ctrl+P' },
        { label: 'Go to Line/Col...', shortcut: 'Ctrl+G' },
        { label: 'Next Editor', shortcut: 'Ctrl+PageDown' },
        { label: 'Previous Editor', shortcut: 'Ctrl+PageUp' }
      ]
    },
    {
      id: 'run',
      label: 'Run',
      items: [
        { label: 'Run Code', shortcut: 'F5', action: handleRunCode },
        { label: 'Start Debugging', shortcut: 'F5', action: handleRunCode },
        { label: 'Run Without Debugging', shortcut: 'Ctrl+F5', action: handleRunCode }
      ]
    },
    {
      id: 'terminal',
      label: 'Terminal',
      items: [
        { label: 'New Terminal', shortcut: 'Ctrl+Shift+`', action: () => {
          setActiveConsoleTab('terminal');
          setConsoleDrawerOpen(true);
        }},
        { label: 'Split Terminal', shortcut: 'Ctrl+Shift+5' },
        { label: 'Run Active File', action: handleRunCode }
      ]
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { label: 'Welcome', action: () => alert('Welcome to MYGO IDE!') },
        { label: 'Documentation', action: () => window.open('https://github.com') },
        { label: 'About MYGO IDE', action: () => alert('MYGO IDE v1.0.0 - Cloud Development Platform') }
      ]
    }
  ];

  const getSidebarPanel = () => {
    switch (state.selectedPanel) {
      case 'explorer': return <ExplorerPanel />;
      case 'git': return <GitExplorer />;
      case 'docker': return <DockerDashboard />;
      case 'k8s': return <K8sExplorer />;
      case 'aws': return <AWSExplorer />;
      case 'db': return <DBExplorer />;
      case 'devops': return <DevOpsDashboard />;
      case 'security': return <SecurityCenter />;
      case 'monitoring': return <Monitoring />;
      default: return <ExplorerPanel />;
    }
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden radial-gradient-glow ${state.settings.theme}`}>
      {openMenuId && (
        <div 
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setOpenMenuId(null)}
        />
      )}
      
      {/* 1. TOP HEADER BAR */}
      <header className="flex justify-between items-center h-12 px-4 bg-bg-secondary border-b border-border-color z-50 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="text-accent-cyan animate-pulse-glow" size={16} />
            <h1 className="text-xs font-bold tracking-wider font-sans uppercase">MYGO <span className="accent-text text-accent-violet">IDE</span></h1>
          </div>

          {/* VS Code Dropdown Menu Bar */}
          <div className="flex items-center ml-2 relative z-50">
            {menus.map(menu => {
              const isOpen = openMenuId === menu.id;
              return (
                <div key={menu.id} className="relative">
                  <button
                    onClick={() => setOpenMenuId(isOpen ? null : menu.id)}
                    onMouseEnter={() => {
                      if (openMenuId !== null) {
                        setOpenMenuId(menu.id);
                      }
                    }}
                    className={`px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                      isOpen 
                        ? 'bg-border-color text-text-main font-semibold' 
                        : 'text-text-muted hover:text-text-main hover:bg-bg-primary/45'
                    }`}
                  >
                    {menu.label}
                  </button>

                  {isOpen && (
                    <div className="absolute left-0 mt-1 w-56 bg-[#181d28] border border-border-color rounded shadow-2xl py-1 z-50 flex flex-col">
                      {menu.items.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (item.action) item.action();
                            setOpenMenuId(null);
                          }}
                          className="w-full flex justify-between items-center px-4 py-1.5 text-[11px] text-text-muted hover:text-text-main hover:bg-accent-violet/20 text-left transition-colors"
                        >
                          <span>{item.label}</span>
                          {item.shortcut && (
                            <span className="text-[9px] text-text-muted/65 font-mono ml-4">{item.shortcut}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <div className="flex items-center gap-1.5 bg-bg-primary/50 border border-border-color rounded px-2.5 py-1">
             <span className="w-1.5 h-1.5 bg-accent-green rounded-full shadow-[0_0_8px_#10b981]" />
             <span className="font-mono text-[10px]">workspace: mygo_cloud_env</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-text-muted ml-3">
            <UserCheck size={12} className="text-accent-cyan" />
            <span>Role: <strong className="text-text-main font-semibold">{state.user?.role}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleRunCode}
            title="Compile & Run Active File"
            className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-accent-violet to-accent-cyan text-white hover:opacity-90 font-bold px-3 py-1 rounded shadow-lg shadow-accent-violet/15 transition-all active:scale-95"
          >
            <Play size={11} fill="currentColor" /> Run Code
          </button>
          
          <button 
            onClick={toggleTheme}
            title="Toggle Light/Dark Mode"
            className="p-1.5 bg-bg-primary hover:bg-border-color border border-border-color rounded text-text-muted hover:text-text-main transition"
          >
            {state.settings.theme === 'dark-theme' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          
          <button 
            onClick={handleLogout}
            title="Log Out Session"
            className="p-1.5 bg-bg-primary hover:bg-border-color border border-border-color rounded text-text-muted hover:text-accent-red transition"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* 2. MAIN DEVELOPMENT WORKBENCH */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ACTIVITY BAR */}
        <aside className="w-12 bg-bg-primary border-r border-border-color flex flex-col items-center justify-between py-4 select-none">
          <div className="flex flex-col gap-4">
            {[
              { id: 'explorer', icon: <FolderOpen size={16} />, title: 'File Explorer' },
              { id: 'git', icon: <GitBranch size={16} />, title: 'Source Control (Git)' },
              { id: 'docker', icon: <Server size={16} />, title: 'Docker Containers' },
              { id: 'k8s', icon: <Layers size={16} />, title: 'Kubernetes Pods' },
              { id: 'aws', icon: <Cpu size={16} />, title: 'AWS Cloud Explorer' },
              { id: 'db', icon: <Database size={16} />, title: 'Database Explorer' },
              { id: 'devops', icon: <Package size={16} />, title: 'DevOps & Marketplace' },
              { id: 'security', icon: <ShieldCheck size={16} />, title: 'Security Audits' },
              { id: 'monitoring', icon: <Activity size={16} />, title: 'Telemetry Metrics' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => dispatch(setSelectedPanel(tab.id))}
                title={tab.title}
                className={`p-2 rounded-lg transition-all relative ${
                  state.selectedPanel === tab.id 
                    ? 'text-accent-cyan bg-accent-cyan/10 shadow-inner' 
                    : 'text-text-muted hover:text-text-main hover:bg-bg-secondary/45'
                }`}
              >
                {tab.icon}
                {state.selectedPanel === tab.id && (
                  <span className="absolute right-0 top-1/4 h-1/2 w-0.5 bg-accent-cyan rounded-l" />
                )}
              </button>
            ))}
          </div>

          <button title="Settings" className="text-text-muted hover:text-text-main p-2 hover:bg-bg-secondary/45 rounded-lg transition">
            <Settings size={16} />
          </button>
        </aside>

        {/* SIDEBAR PANEL DRAWER */}
        <aside className="w-64 bg-bg-secondary border-r border-border-color flex flex-col overflow-hidden">
          {getSidebarPanel()}
        </aside>

        {/* CENTER WORKSPACE: MULTI-TAB EDITOR & CONSOLE DRAWER */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-bg-primary">
          {/* Tab bar header */}
          <div className="flex h-9 bg-bg-secondary border-b border-border-color overflow-x-auto select-none">
            {state.openFiles.map(path => {
              const active = state.activeFile === path;
              const name = path.split('/').pop() || path;
              return (
                <div 
                  key={path}
                  onClick={() => dispatch(setActiveFile(path))}
                  className={`flex items-center gap-2 px-3 py-1 cursor-pointer transition border-r border-border-color text-xs ${
                    active ? 'bg-bg-primary text-text-main border-b-2 border-b-accent-cyan' : 'text-text-muted hover:text-text-main hover:bg-bg-primary/25'
                  }`}
                >
                  <span className="truncate max-w-[100px] font-mono">{name}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(closeFile(path));
                    }}
                    className="p-0.5 rounded hover:bg-border-color text-text-muted hover:text-accent-red"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-0 relative">
            {state.activeFile ? (
              <MonacoEditor 
                filePath={state.activeFile}
                fontSize={state.settings.font_size}
                autosave={state.settings.autosave}
                theme={state.settings.theme}
                onCursorChange={(line, col) => setCursorPos({ line, col })}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted select-none text-xs font-mono">
                <Sparkles size={36} className="text-accent-cyan opacity-20 mb-3 animate-pulse" />
                <div className="font-semibold text-sm">Welcome to MYGO IDE</div>
                <div className="text-[10px] opacity-60 mt-1">Select a file from the explorer or create a new template project.</div>
                <div className="flex gap-2 mt-4 text-[9px]">
                  <span className="bg-bg-secondary px-2 py-1 border border-border-color rounded">Ctrl + P (Quick Open)</span>
                  <span className="bg-bg-secondary px-2 py-1 border border-border-color rounded">Run Code (Ctrl + F5)</span>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM DRAWER CONSOLE */}
          <div 
            style={{ height: consoleDrawerOpen ? `${drawerHeight}px` : '32px' }}
            className={`bg-[#0c0f16] border-t border-border-color flex flex-col relative ${
              isDragging ? '' : 'transition-all duration-200'
            }`}
          >
            {/* Drag Handle */}
            <div 
              className="h-1.5 w-full cursor-ns-resize absolute -top-0.5 left-0 bg-transparent hover:bg-accent-cyan/50 z-30 transition-colors"
              onMouseDown={handleMouseDown}
            />
            {/* Console Tabs */}
            <div className="h-8 bg-bg-secondary border-b border-border-color flex justify-between items-center px-4 select-none">
              <div className="flex gap-3 h-full">
                {[
                  { id: 'terminal', label: 'Terminal' },
                  { id: 'output', label: 'Output' },
                  { id: 'problems', label: 'Problems' },
                  { id: 'debug', label: 'Debug Console' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => {
                      setActiveConsoleTab(tab.id as any);
                      setConsoleDrawerOpen(true);
                    }}
                    className={`h-full text-[10px] uppercase font-bold tracking-wider border-b-2 px-1 transition ${
                      activeConsoleTab === tab.id && consoleDrawerOpen
                        ? 'border-accent-cyan text-accent-cyan' 
                        : 'border-transparent text-text-muted hover:text-text-main'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setConsoleDrawerOpen(!consoleDrawerOpen)}
                className="text-text-muted hover:text-text-main"
              >
                {consoleDrawerOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>

            {/* Console Drawer Body */}
            {consoleDrawerOpen && (
              <div className="flex-1 min-h-0 bg-[#0c0f16]">
                {activeConsoleTab === 'terminal' && (
                  <Terminal terminalId="term-1" />
                )}
                {activeConsoleTab === 'output' && (
                  <div className="w-full h-full p-4 overflow-y-auto font-mono text-xs text-text-main flex flex-col gap-1 select-text">
                    {outputLogs.map((log, i) => <div key={i}>{log}</div>)}
                  </div>
                )}
                {activeConsoleTab === 'problems' && (
                  <div className="w-full h-full p-4 overflow-y-auto font-sans text-xs text-text-muted flex flex-col gap-2 select-text">
                    <div className="flex items-center gap-1.5 text-accent-yellow font-semibold text-[10px] uppercase tracking-wider mb-1 border-b border-border-color/30 pb-1">
                      <AlertTriangle size={12} /> Workspace Audit Recommendations
                    </div>
                    <div className="flex flex-col gap-1 text-[11px]">
                      <div>• SEC-001 (CRITICAL) in [backend/main.py]: Google Gemini API Key exposed in cleartext.</div>
                      <div>• SEC-003 (MEDIUM) in [frontend/src/store/workspaceSlice.ts]: Hardcoded Mock Credentials detected.</div>
                    </div>
                  </div>
                )}
                {activeConsoleTab === 'debug' && (
                  <div className="w-full h-full p-4 overflow-y-auto font-mono text-xs text-text-muted flex flex-col gap-1 select-text">
                    <div className="text-[10px] text-text-muted italic">MYGO debug broker active. Type expressions to evaluate.</div>
                    <div className="flex gap-2 text-text-main mt-2">
                      <span className="text-accent-violet font-bold">&gt;</span>
                      <input 
                        type="text" 
                        placeholder="Evaluate JavaScript/Python expressions..." 
                        className="flex-1 bg-transparent border-none outline-none text-xs text-text-main"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value;
                            if (val.trim()) {
                              alert(`Evaluated dynamic debug script: ${val}`);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* 3. RIGHT PANEL - AI COMPANION */}
        {state.aiSidebarOpen && (
          <aside className="w-80 flex flex-col">
            <AIPanel activeFile={state.activeFile} />
          </aside>
        )}
      </div>

      {/* 4. FOOTER STATUS BAR */}
      <footer className="h-6 px-4 bg-bg-secondary border-t border-border-color flex justify-between items-center text-[10px] text-text-muted select-none z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => dispatch(toggleAISidebar())}
            title={state.aiSidebarOpen ? "Collapse AI Panel" : "Expand AI Panel"}
            className="flex items-center gap-1 hover:text-text-main text-accent-cyan"
          >
            {state.aiSidebarOpen ? <PanelRightClose size={11} /> : <PanelRight size={11} />}
            <span>AI Assistant</span>
          </button>
          <span>•</span>
          <span className="font-mono">{state.activeFile ? `Language: ${state.activeFile.split('.').pop()?.toUpperCase()}` : 'No open file'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Row {cursorPos.line}, Col {cursorPos.col}</span>
          <span>•</span>
          <span>Spaces: 2</span>
          <span>•</span>
          <span>UTF-8</span>
        </div>
      </footer>

    </div>
  );
}
