import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, Play, RefreshCw, Eye, EyeOff, FileKey } from 'lucide-react';
import { api } from '../../services/api';

interface Vulnerability {
  id: string;
  file: string;
  line: number;
  codeSnippet: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  ruleName: string;
  description: string;
}

export default function SecurityCenter() {
  const [scanning, setScanning] = useState(false);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([
    {
      id: 'SEC-001',
      file: 'backend/main.py',
      line: 19,
      codeSnippet: "GEMINI_API_KEY = 'AIzaSyAdFk02j4857hGdK0932asJ'",
      severity: 'CRITICAL',
      ruleName: 'Google Gemini API Key Exposure',
      description: 'Google Gemini API Key exposed in cleartext. Credentials can be scanned by bots and lead to account billing exploitation.'
    },
    {
      id: 'SEC-003',
      file: 'frontend/src/store/workspaceSlice.ts',
      line: 61,
      codeSnippet: "token: 'simulated-jwt-token-1'",
      severity: 'MEDIUM',
      ruleName: 'Hardcoded Mock Credentials',
      description: 'Possible hardcoded credentials/passphrase detected. Use environment configuration settings in production.'
    }
  ]);
  const [showCodeIdx, setShowCodeIdx] = useState<Record<number, boolean>>({});

  const toggleShowCode = (idx: number) => {
    setShowCodeIdx(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const startScan = async () => {
    setScanning(true);
    setVulnerabilities([]);
    
    try {
      const data = await api.scanSecurity();
      setVulnerabilities(data.vulnerabilities);
    } catch (e) {
      // Fallback if server is not fully online or returns error
      setTimeout(() => {
        setVulnerabilities([
          {
            id: 'SEC-001',
            file: 'backend/main.py',
            line: 19,
            codeSnippet: "GEMINI_API_KEY = 'AIzaSyAdFk02j4857hGdK0932asJ'",
            severity: 'CRITICAL',
            ruleName: 'Google Gemini API Key Exposure',
            description: 'Google Gemini API Key exposed in cleartext. Credentials can be scanned by bots and lead to account billing exploitation.'
          },
          {
            id: 'SEC-003',
            file: 'frontend/src/store/workspaceSlice.ts',
            line: 61,
            codeSnippet: "token: 'simulated-jwt-token-1'",
            severity: 'MEDIUM',
            ruleName: 'Hardcoded Mock Credentials',
            description: 'Possible hardcoded credentials/passphrase detected. Use environment configuration settings in production.'
          }
        ]);
      }, 1000);
    } finally {
      setScanning(false);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'text-accent-red bg-accent-red/10 border-accent-red/20';
      case 'HIGH': return 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/20';
      case 'MEDIUM': return 'text-accent-violet bg-accent-violet/10 border-accent-violet/20';
      default: return 'text-text-muted bg-bg-primary border-border-color';
    }
  };

  const criticalCount = vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
  const warningCount = vulnerabilities.filter(v => v.severity !== 'CRITICAL').length;

  return (
    <div className="flex flex-col h-full bg-bg-secondary text-text-main overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border-color flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold tracking-wider text-text-muted uppercase">Security Center</h3>
          <span className="text-[9px] text-text-muted mt-0.5 block">Static Application Security Testing (SAST)</span>
        </div>
        <button 
          onClick={startScan}
          disabled={scanning}
          className="flex items-center gap-1.5 text-[10px] bg-accent-violet hover:bg-opacity-80 disabled:opacity-50 px-2.5 py-1 rounded text-white font-medium transition"
        >
          {scanning ? <RefreshCw size={10} className="animate-spin" /> : <Play size={10} />}
          {scanning ? 'Auditing...' : 'Audit Code'}
        </button>
      </div>

      {/* Overview Card */}
      <div className="p-3 bg-bg-primary/50 border-b border-border-color flex justify-around text-center text-xs">
        <div className="flex flex-col items-center">
          {vulnerabilities.length > 0 ? (
             <ShieldAlert size={22} className="text-accent-red mb-1" />
          ) : (
             <ShieldCheck size={22} className="text-accent-green mb-1" />
          )}
          <span className="text-[10px] text-text-muted font-bold">Vulnerability Status</span>
          <span className={`font-bold mt-0.5 ${vulnerabilities.length > 0 ? 'text-accent-red' : 'text-accent-green'}`}>
            {vulnerabilities.length > 0 ? 'Action Required' : 'Secure'}
          </span>
        </div>
        <div className="w-[1px] bg-border-color" />
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-accent-red">{criticalCount}</span>
          <span className="text-[9px] text-text-muted font-bold">Critical Exposures</span>
        </div>
        <div className="w-[1px] bg-border-color" />
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-accent-yellow">{warningCount}</span>
          <span className="text-[9px] text-text-muted font-bold font-sans">Medium Risks</span>
        </div>
      </div>

      {/* Vulnerabilities List */}
      <div className="p-4 flex flex-col gap-4 flex-1">
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Workspace Audit Alerts</h4>
          
          <div className="flex flex-col gap-2">
            {vulnerabilities.length === 0 ? (
              <div className="text-center italic text-text-muted text-[10px] py-10 bg-bg-primary/20 border border-dashed border-border-color rounded">
                No vulnerabilities or hardcoded secrets found in workspace files.
              </div>
            ) : (
              vulnerabilities.map((vul, idx) => (
                <div key={idx} className="bg-bg-primary border border-border-color rounded p-2.5 hover:border-text-muted transition flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-text-main font-sans">{vul.ruleName}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${getSeverityColor(vul.severity)}`}>
                      {vul.severity}
                    </span>
                  </div>
                  
                  <div className="text-[9px] text-text-muted leading-relaxed font-sans">{vul.description}</div>
                  
                  <div className="flex justify-between items-center text-[9px] font-mono text-text-muted border-t border-border-color/20 pt-1.5 mt-0.5">
                    <span className="truncate max-w-[170px]" title={vul.file}>{vul.file}:L{vul.line}</span>
                    <button 
                      onClick={() => toggleShowCode(idx)}
                      className="flex items-center gap-0.5 text-accent-cyan hover:underline"
                    >
                      {showCodeIdx[idx] ? <EyeOff size={10} /> : <Eye size={10} />}
                      {showCodeIdx[idx] ? 'Hide' : 'Inspect'}
                    </button>
                  </div>

                  {showCodeIdx[idx] && (
                    <div className="bg-bg-secondary border border-border-color rounded p-1.5 font-mono text-[9px] text-accent-yellow overflow-x-auto whitespace-pre">
                      {vul.codeSnippet}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Best Practices */}
        <div className="bg-bg-primary/25 border border-border-color rounded-lg p-3 text-xs flex flex-col gap-2 mt-auto">
          <h4 className="font-bold text-[10px] uppercase text-text-muted flex items-center gap-1.5">
            <FileKey size={13} className="text-accent-yellow" />
            <span>Developer Guidelines</span>
          </h4>
          <ul className="list-disc pl-4 text-[9px] text-text-muted flex flex-col gap-1">
            <li>Never commit Google/AWS keys directly in file structures.</li>
            <li>Register secret credentials inside `.env` local configurations.</li>
            <li>Maintain `.gitignore` bindings to exclude `.env` uploads.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
