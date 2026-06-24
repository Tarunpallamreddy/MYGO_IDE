import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, Loader2, PlayCircle, LayoutGrid } from 'lucide-react';
import { api } from '../../services/api';

interface Pipeline {
  id: string;
  name: string;
  trigger: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  duration: string;
  steps: string[];
}

export default function DevOpsDashboard() {
  const [subPanel, setSubPanel] = useState<'devops' | 'extensions' | 'templates'>('devops');
  
  // 1. DevOps State
  const [pipelines, setPipelines] = useState<Pipeline[]>([
    { id: '#105', name: 'AWS EKS Deployment', trigger: 'git push (main)', status: 'RUNNING', duration: '1m 12s', steps: ['Lint Code (Complete)', 'Build Container Image (Complete)', 'Push to Amazon ECR (Complete)', 'Rolling Restart Kubernetes pods (Running)'] },
    { id: '#104', name: 'Lint & Unit Tests', trigger: 'Pull Request #14', status: 'SUCCESS', duration: '2m 45s', steps: ['Restore dependencies', 'Code Linting', 'Run 45 unit tests', 'Code coverage report generated'] },
    { id: '#103', name: 'AWS ECS Blue/Green Deploy', trigger: 'Manual Run', status: 'FAILED', duration: '48s', steps: ['Provision container replicas (Complete)', 'LoadBalancer Health Check (Failed)'] },
  ]);

  // 2. Extensions State
  const [extensions, setExtensions] = useState([
    { name: 'Dracula Theme Override', desc: 'Dracula color profile mapping for Monaco editor.', category: 'Themes', rating: 4.9, downloads: '1.2M', installed: false },
    { name: 'Rust Analyzer Client', desc: 'Autocomplete & definition diagnostics for Rust projects.', category: 'Languages', rating: 4.8, downloads: '850K', installed: true },
    { name: 'DevOps Pod Terminal Manager', desc: 'Direct kubectl shell attachment shortcuts.', category: 'DevOps Tools', rating: 4.7, downloads: '320K', installed: false },
    { name: 'AWS Cloud Cost Tracker', desc: 'Displays resource billing values inside sidebar indicators.', category: 'Cloud Tools', rating: 4.6, downloads: '120K', installed: false }
  ]);

  // 3. Templates State
  const [generating, setGenerating] = useState<string | null>(null);

  const toggleInstallExtension = (name: string) => {
    setExtensions(extensions.map(ext => {
      if (ext.name === name) {
        return { ...ext, installed: !ext.installed };
      }
      return ext;
    }));
  };

  const runPipeline = (id: string) => {
    setPipelines(pipelines.map(pipe => {
      if (pipe.id === id) {
        return {
          ...pipe,
          status: 'RUNNING',
          duration: '0s',
          steps: ['Initializing runner container...', 'Fetching code branches...']
        };
      }
      return pipe;
    }));

    // Complete pipeline status update after 4s
    setTimeout(() => {
      setPipelines(prev => prev.map(pipe => {
        if (pipe.id === id) {
          return {
            ...pipe,
            status: 'SUCCESS',
            duration: '1m 02s',
            steps: ['Initializing runner container (Complete)', 'Fetching code branches (Complete)', 'Process finished successfully.']
          };
        }
        return pipe;
      }));
    }, 4000);
  };

  const createTemplateProject = async (templateName: string) => {
    setGenerating(templateName);
    
    // Define the directories/files based on template
    const relativePaths = templateName === 'React Web App' 
      ? ['src/App.tsx', 'src/main.tsx', 'package.json', 'vite.config.ts']
      : templateName === 'FastAPI Backend'
      ? ['main.py', 'requirements.txt', 'database.py', 'routes/auth.py']
      : ['main.tf', 'variables.tf', 'outputs.tf', 'terraform.tfvars'];

    try {
      // Trigger API writes in backend to create folders and files
      for (const relPath of relativePaths) {
        const fullRel = `templates/${templateName.toLowerCase().replace(/\s+/g, '-')}/${relPath}`;
        await api.createItem(fullRel, false);
        await api.writeFile(fullRel, `# Template auto-generated file: ${relPath}\n`);
      }
    } catch (e) {
      console.log("Mock write triggered - file folder setup offline");
    }

    setTimeout(() => {
      setGenerating(null);
      alert(`Successfully generated template project directories for ${templateName} at workspace!`);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary text-text-main overflow-y-auto">
      {/* Sidebar Sub-tabs */}
      <div className="flex border-b border-border-color bg-bg-primary/45 p-1 gap-1">
        <button 
          onClick={() => setSubPanel('devops')}
          className={`flex-1 text-[10px] uppercase font-bold py-1.5 rounded transition ${
            subPanel === 'devops' ? 'bg-accent-violet/15 text-accent-violet border border-accent-violet/30' : 'text-text-muted hover:text-text-main'
          }`}
        >
          DevOps
        </button>
        <button 
          onClick={() => setSubPanel('extensions')}
          className={`flex-1 text-[10px] uppercase font-bold py-1.5 rounded transition ${
            subPanel === 'extensions' ? 'bg-accent-violet/15 text-accent-violet border border-accent-violet/30' : 'text-text-muted hover:text-text-main'
          }`}
        >
          Marketplace
        </button>
        <button 
          onClick={() => setSubPanel('templates')}
          className={`flex-1 text-[10px] uppercase font-bold py-1.5 rounded transition ${
            subPanel === 'templates' ? 'bg-accent-violet/15 text-accent-violet border border-accent-violet/30' : 'text-text-muted hover:text-text-main'
          }`}
        >
          Templates
        </button>
      </div>

      {/* DevOps Sub-Panel */}
      {subPanel === 'devops' && (
        <div className="p-4 flex flex-col gap-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <PlayCircle size={13} className="text-accent-cyan" />
            <span>GitHub Actions Pipelines</span>
          </h4>
          
          <div className="flex flex-col gap-3">
            {pipelines.map(pipe => (
              <div key={pipe.id} className="bg-bg-primary border border-border-color rounded p-3 flex flex-col gap-2 hover:border-text-muted transition">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-mono text-accent-cyan bg-accent-cyan/10 px-1 rounded">{pipe.id}</span>
                    <span className="text-xs font-semibold text-text-main ml-2">{pipe.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {pipe.status === 'RUNNING' ? (
                       <Loader2 size={13} className="text-accent-violet animate-spin" />
                    ) : pipe.status === 'SUCCESS' ? (
                       <CheckCircle2 size={13} className="text-accent-green" />
                    ) : (
                       <XCircle size={13} className="text-accent-red" />
                    )}
                    <span className={`text-[9px] font-bold ${
                      pipe.status === 'RUNNING' ? 'text-accent-violet' :
                      pipe.status === 'SUCCESS' ? 'text-accent-green' : 'text-accent-red'
                    }`}>
                      {pipe.status}
                    </span>
                  </div>
                </div>

                <div className="text-[9px] text-text-muted">Trigger: {pipe.trigger} • Duration: {pipe.duration}</div>
                
                <div className="border-t border-border-color/25 pt-2 flex flex-col gap-1 font-mono text-[9px] text-text-muted">
                  {pipe.steps.map((step, idx) => (
                    <div key={idx} className="truncate">• {step}</div>
                  ))}
                </div>

                {pipe.status !== 'RUNNING' && (
                  <button 
                    onClick={() => runPipeline(pipe.id)}
                    className="mt-1 w-full bg-bg-secondary hover:bg-border-color border border-border-color py-1 rounded text-[9px] font-medium text-text-main flex items-center justify-center gap-1 transition"
                  >
                    <Play size={8} fill="currentColor" /> Rerun Workflow
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extensions Sub-Panel */}
      {subPanel === 'extensions' && (
        <div className="p-4 flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <LayoutGrid size={13} className="text-accent-violet" />
            <span>IDE Extensions Marketplace</span>
          </h4>
          
          <div className="flex flex-col gap-2">
            {extensions.map(ext => (
              <div key={ext.name} className="bg-bg-primary border border-border-color rounded p-3 flex flex-col gap-1 hover:border-text-muted transition">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-text-main leading-snug">{ext.name}</span>
                  <span className="text-[8px] bg-bg-secondary text-text-muted px-1.5 py-0.2 rounded uppercase tracking-wider font-semibold border border-border-color">{ext.category}</span>
                </div>
                <div className="text-[10px] text-text-muted leading-relaxed my-1">{ext.desc}</div>
                <div className="flex justify-between items-center text-[9px] text-text-muted border-t border-border-color/25 pt-2 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-accent-yellow">★ {ext.rating}</span>
                    <span>Downloads: {ext.downloads}</span>
                  </div>
                  <button 
                    onClick={() => toggleInstallExtension(ext.name)}
                    className={`px-3 py-0.5 rounded text-[10px] font-semibold border transition ${
                      ext.installed 
                        ? 'bg-bg-secondary border-border-color text-text-muted hover:text-accent-red hover:bg-accent-red/5 hover:border-accent-red/20' 
                        : 'bg-accent-violet border-transparent text-white hover:bg-opacity-80'
                    }`}
                  >
                    {ext.installed ? 'Uninstall' : 'Install'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates Sub-Panel */}
      {subPanel === 'templates' && (
        <div className="p-4 flex flex-col gap-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <LayoutGrid size={13} className="text-accent-green" />
            <span>Generate Project Templates</span>
          </h4>
          
          <div className="flex flex-col gap-2">
            {[
              { name: 'React Web App', desc: 'Frontend React + TypeScript + Tailwind bundle', icon: '⚛️' },
              { name: 'FastAPI Backend', desc: 'REST server with SQLite seeder and Socket.io', icon: '🐍' },
              { name: 'Terraform AWS S3/EC2', desc: 'Secure cloud hosting infrastructure modules', icon: '☁️' }
            ].map(tpl => (
              <div key={tpl.name} className="bg-bg-primary border border-border-color rounded p-3 flex justify-between items-center hover:border-text-muted transition">
                <div className="max-w-[70%]">
                  <div className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                    <span>{tpl.icon}</span> {tpl.name}
                  </div>
                  <div className="text-[10px] text-text-muted mt-1 leading-normal">{tpl.desc}</div>
                </div>
                <button 
                  onClick={() => createTemplateProject(tpl.name)}
                  disabled={generating !== null}
                  className="bg-accent-violet hover:bg-opacity-80 py-1 px-3 text-[10px] text-white font-medium rounded transition flex items-center gap-1 disabled:opacity-50"
                >
                  {generating === tpl.name ? <Loader2 size={10} className="animate-spin" /> : 'Generate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
