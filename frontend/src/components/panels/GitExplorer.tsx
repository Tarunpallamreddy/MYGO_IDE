import React, { useState } from 'react';
import { GitBranch, GitCommit, ArrowUp, ArrowDown, Check, RefreshCw, FileCode, Plus, Minus, GitPullRequest } from 'lucide-react';

interface GitFile {
  name: string;
  path: string;
  status: 'modified' | 'untracked' | 'deleted';
  staged: boolean;
}

export default function GitExplorer() {
  const [branch, setBranch] = useState('main');
  const [commitMsg, setCommitMsg] = useState('');
  const [gitStatus, setGitStatus] = useState<string[]>([]);
  const [files, setFiles] = useState<GitFile[]>([
    { name: 'App.tsx', path: 'frontend/src/App.tsx', status: 'modified', staged: false },
    { name: 'requirements.txt', path: 'backend/requirements.txt', status: 'modified', staged: true },
    { name: 'EC2-Server.tf', path: 'terraform/EC2-Server.tf', status: 'untracked', staged: false },
  ]);
  const [gitHistory, setGitHistory] = useState([
    { hash: 'e28bb4a', author: 'mygo-user', message: 'feat: add database explorer layout', age: '3h ago' },
    { hash: 'a12fc8b', author: 'tarun-saiteja', message: 'refactor: split sidebar components', age: '1d ago' },
    { hash: '9b00aa1', author: 'mygo-user', message: 'init: bootstrap react-vite and fastapi structure', age: '2d ago' },
  ]);

  const addLog = (msg: string) => {
    setGitStatus(prev => [`[git] ${msg}`, ...prev]);
  };

  const toggleStage = (path: string) => {
    setFiles(files.map(f => {
      if (f.path === path) {
        addLog(`${f.staged ? 'Unstaged' : 'Staged'} ${f.name}`);
        return { ...f, staged: !f.staged };
      }
      return f;
    }));
  };

  const stageAll = () => {
    setFiles(files.map(f => ({ ...f, staged: true })));
    addLog("Staged all changes.");
  };

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMsg.trim()) return;
    
    const stagedFiles = files.filter(f => f.staged);
    if (stagedFiles.length === 0) {
      addLog("Warning: No changes staged for commit. Stage changes first!");
      return;
    }

    const newHash = Math.random().toString(16).substring(2, 9);
    const newCommit = {
      hash: newHash,
      author: 'mygo-user',
      message: commitMsg,
      age: 'Just now'
    };

    setGitHistory([newCommit, ...gitHistory]);
    setFiles(files.filter(f => !f.staged));
    addLog(`Committed ${stagedFiles.length} files: ${commitMsg} (${newHash})`);
    setCommitMsg('');
  };

  const syncRepository = () => {
    addLog("Syncing with origin/main (git pull --rebase && git push)...");
    setTimeout(() => {
      addLog("Successfully synced repository with GitHub.");
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary text-text-main overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border-color flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold tracking-wider text-text-muted uppercase">Source Control</h3>
          <div className="flex items-center gap-1 text-[10px] text-accent-cyan mt-1">
            <GitBranch size={10} />
            <span>branch: {branch}</span>
          </div>
        </div>
        <button 
          onClick={syncRepository}
          title="Synchronize Changes"
          className="p-1.5 rounded bg-bg-primary hover:bg-border-color text-text-muted hover:text-text-main transition flex items-center gap-1 text-[10px]"
        >
          <RefreshCw size={11} /> Sync
        </button>
      </div>

      {/* Commit Input Area */}
      <div className="p-3 border-b border-border-color bg-bg-primary/25">
        <form onSubmit={handleCommit} className="flex flex-col gap-2">
          <input 
            type="text" 
            placeholder="Commit message (Ctrl+Enter to commit)" 
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            className="w-full bg-bg-primary border border-border-color rounded px-2.5 py-1.5 text-xs outline-none focus:border-border-focus text-text-main placeholder-text-muted font-sans"
          />
          <button 
            type="submit"
            className="w-full bg-accent-violet hover:bg-opacity-80 py-1.5 rounded text-white font-medium text-xs flex items-center justify-center gap-1.5 transition"
          >
            <GitCommit size={13} /> Commit
          </button>
        </form>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1">
        
        {/* Source files status list */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Changes ({files.length})</h4>
            {files.some(f => !f.staged) && (
              <button 
                onClick={stageAll}
                className="text-[10px] text-accent-cyan hover:underline flex items-center gap-0.5"
              >
                <Plus size={10} /> Stage All
              </button>
            )}
          </div>
          
          <div className="flex flex-col gap-1.5">
            {files.length === 0 ? (
              <div className="text-center italic text-text-muted text-[10px] py-6 bg-bg-primary/20 border border-dashed border-border-color rounded">
                No local modifications. Working tree clean.
              </div>
            ) : (
              files.map(f => (
                <div key={f.path} className="flex items-center justify-between p-2 bg-bg-primary border border-border-color rounded hover:border-text-muted transition">
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <FileCode size={13} className={f.status === 'untracked' ? 'text-accent-yellow' : f.status === 'deleted' ? 'text-accent-red' : 'text-accent-violet'} />
                    <div>
                      <div className="text-xs font-medium text-text-main truncate" title={f.name}>{f.name}</div>
                      <div className="text-[9px] text-text-muted truncate" title={f.path}>{f.path}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 rounded uppercase font-mono ${
                      f.status === 'modified' ? 'text-accent-cyan bg-accent-cyan/10' :
                      f.status === 'untracked' ? 'text-accent-yellow bg-accent-yellow/10' :
                      'text-accent-red bg-accent-red/10'
                    }`}>
                      {f.status === 'modified' ? 'M' : f.status === 'untracked' ? 'U' : 'D'}
                    </span>
                    <button 
                      onClick={() => toggleStage(f.path)}
                      title={f.staged ? "Unstage changes" : "Stage changes"}
                      className={`p-1 rounded transition border ${
                        f.staged 
                          ? 'bg-accent-green/20 border-accent-green/45 text-accent-green' 
                          : 'bg-bg-secondary border-border-color text-text-muted hover:text-text-main'
                      }`}
                    >
                      {f.staged ? <Check size={10} /> : <Plus size={10} />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* History Tree */}
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
            <GitPullRequest size={12} className="text-accent-cyan" />
            <span>Commit History</span>
          </h4>
          <div className="flex flex-col gap-2.5 relative pl-3 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[1px] before:bg-border-color">
            {gitHistory.map(hist => (
              <div key={hist.hash} className="relative flex flex-col">
                <span className="absolute -left-[14px] top-1.5 w-2.5 h-2.5 rounded-full border border-bg-secondary bg-accent-violet shadow-[0_0_4px_#8b5cf6]" />
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-semibold text-text-main truncate max-w-[150px]">{hist.message}</span>
                  <span className="text-accent-cyan ml-2 bg-accent-cyan/10 px-1 rounded">{hist.hash}</span>
                </div>
                <div className="text-[9px] text-text-muted mt-0.5">{hist.author} • {hist.age}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal Output Logs */}
        <div className="mt-auto border-t border-border-color pt-3">
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Git Client Logs</h4>
          <div className="bg-bg-primary border border-border-color rounded h-[80px] p-2 overflow-y-auto font-mono text-[9px] text-text-muted flex flex-col gap-1">
            {gitStatus.length === 0 ? (
              <div className="text-center italic mt-5 text-[9px]">Run git tasks to print outputs.</div>
            ) : (
              gitStatus.map((log, i) => <div key={i} className="whitespace-pre-wrap">{log}</div>)
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
