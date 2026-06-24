import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, Bot, AlertTriangle, ShieldAlert, Cpu, Terminal, Key, Play } from 'lucide-react';
import { api } from '../../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  simulated?: boolean;
}

interface AIPanelProps {
  activeFile: string | null;
}

export default function AIPanel({ activeFile }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your **MYGO AI Coding Assistant**. Ask me anything about your workspace! You can ask me to write code, design configs, analyze errors, or check cloud deployments.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [agentType, setAgentType] = useState('coding');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const promptText = customPrompt || input;
    if (!promptText.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: promptText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    let activeContent: string | null = null;
    if (activeFile) {
      try {
        activeContent = await api.readFile(activeFile);
      } catch (e) {
        console.error("Failed to read file context for AI:", e);
      }
    }

    try {
      // Setup payload matching backend AIChatRequest
      const chatPayload = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: promptText }
      ];
      
      const responseData = await api.chatWithAI(
        chatPayload,
        activeFile,
        null, // Selected text
        activeContent,
        apiKey || undefined
      );

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: responseData.response, simulated: responseData.simulated }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Error: Failed to fetch AI response from server. Check your backend status.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const triggerAgentShortcut = async (type: string, description: string) => {
    setAgentType(type);
    const agentPrompt = `Agent Task: ${description}`;
    
    const userMessage: Message = { role: 'user', content: `[Running ${type.toUpperCase()} Agent]\n${description}` };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    let activeContent: string | null = null;
    if (activeFile) {
      try {
        activeContent = await api.readFile(activeFile);
      } catch (e) {
        console.error("Failed to read context for AI Agent:", e);
      }
    }

    try {
      const responseData = await api.runAIAgent(
        type,
        description,
        activeFile,
        activeContent,
        apiKey || undefined
      );

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: responseData.response, simulated: responseData.simulated }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Error: ${type.toUpperCase()} Agent failed to process request.` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary border-l border-border-color text-text-main select-text w-full">
      {/* Header */}
      <div className="p-4 border-b border-border-color flex justify-between items-center bg-bg-secondary select-none">
        <h3 className="text-xs font-bold tracking-wider text-text-muted uppercase flex items-center gap-1.5">
          <Sparkles size={14} className="text-accent-cyan animate-pulse-glow" />
          <span>AI Panel & Agents</span>
        </h3>
        <div className="relative group">
          <button title="Configure Gemini API Key" className="p-1 rounded bg-bg-primary hover:bg-border-color border border-border-color text-text-muted hover:text-text-main transition">
            <Key size={12} />
          </button>
          {/* Key popover */}
          <div className="absolute right-0 top-6 hidden group-hover:block bg-bg-primary border border-border-color p-2.5 rounded shadow-lg z-20 w-52 select-none">
            <div className="text-[10px] text-text-muted font-bold uppercase mb-1.5 flex items-center gap-1">
              <Key size={10} className="text-accent-yellow" /> Gemini API Key
            </div>
            <input 
              type="password" 
              placeholder="Paste AIzaSy... key" 
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full bg-bg-secondary border border-border-color rounded text-[10px] p-1 text-text-main outline-none focus:border-border-focus"
            />
            <div className="text-[8px] text-text-muted mt-1 leading-normal">Key is stored locally in-memory. Left blank, the IDE defaults to simulator responses.</div>
          </div>
        </div>
      </div>

      {/* Messages thread */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 max-w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-accent-cyan/15 flex items-center justify-center flex-shrink-0 text-accent-cyan select-none">
                <Bot size={14} />
              </div>
            )}
            
            <div className={`rounded-lg px-3 py-2 text-xs leading-relaxed max-w-[85%] overflow-x-auto ${
              msg.role === 'user' 
                ? 'bg-accent-violet text-white font-medium font-sans' 
                : 'bg-bg-primary border border-border-color/65 text-text-main font-sans'
            }`}>
              {/* Parse basic markdown headers, bold, code block tags */}
              <div className="whitespace-pre-wrap break-words">
                {msg.content.split('\n').map((line, idx) => {
                  if (line.startsWith('###')) {
                    return <h4 key={idx} className="font-bold text-sm text-accent-cyan mt-2 mb-1">{line.replace('###', '')}</h4>;
                  }
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <strong key={idx} className="font-bold text-text-main block mt-1">{line.replace(/\*\*/g, '')}</strong>;
                  }
                  if (line.startsWith('```')) {
                    // Simple skip marker rendering
                    return null;
                  }
                  
                  // Regex match bold and inline codes
                  let processed = line
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/`(.*?)`/g, '<code class="bg-bg-secondary text-accent-yellow px-1 rounded font-mono text-[10px]">$1</code>');
                    
                  return <p key={idx} dangerouslySetInnerHTML={{ __html: processed }} className="my-0.5" />;
                })}
              </div>
              
              {msg.simulated && (
                <div className="text-[9px] text-text-muted mt-1.5 pt-1 border-t border-border-color/30 italic flex items-center gap-1 font-sans select-none">
                  <AlertTriangle size={10} className="text-accent-yellow" />
                  <span>Simulated Agent Response</span>
                </div>
              )}
            </div>
            
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-accent-violet/15 flex items-center justify-center flex-shrink-0 text-accent-violet select-none">
                <User size={14} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 text-xs text-text-muted items-center italic select-none">
            <LoaderIcon className="animate-spin text-accent-cyan mr-1.5" />
            <span>AI Agent compiling context and analyzing...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Shortcuts drawer */}
      <div className="p-3 border-t border-border-color bg-bg-primary/25 select-none">
        <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-2">Agent Action Shortcuts</div>
        <div className="flex flex-wrap gap-1.5">
          <button 
            onClick={() => triggerAgentShortcut('coding', 'Optimize and refactor active code segments.')}
            className="flex items-center gap-1 text-[9px] bg-bg-primary hover:bg-border-color border border-border-color px-2 py-1 rounded text-text-main transition font-medium"
          >
            <Bot size={10} className="text-accent-cyan" /> Refactor
          </button>
          <button 
            onClick={() => triggerAgentShortcut('devops', 'Generate a multi-stage Dockerfile and deployment manifest.')}
            className="flex items-center gap-1 text-[9px] bg-bg-primary hover:bg-border-color border border-border-color px-2 py-1 rounded text-text-main transition font-medium"
          >
            <Terminal size={10} className="text-accent-violet" /> DevOps Setup
          </button>
          <button 
            onClick={() => triggerAgentShortcut('aws', 'Analyze EC2 configuration metrics and recommend security enhancements.')}
            className="flex items-center gap-1 text-[9px] bg-bg-primary hover:bg-border-color border border-border-color px-2 py-1 rounded text-text-main transition font-medium"
          >
            <Cpu size={10} className="text-accent-green" /> AWS Audit
          </button>
          <button 
            onClick={() => triggerAgentShortcut('security', 'Scan the workspace for hardcoded secrets and vulnerable calls.')}
            className="flex items-center gap-1 text-[9px] bg-bg-primary hover:bg-border-color border border-border-color px-2 py-1 rounded text-text-main transition font-medium"
          >
            <ShieldAlert size={10} className="text-accent-red" /> Security Scan
          </button>
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-border-color bg-bg-secondary select-none">
        <div className="relative">
          <input 
            type="text" 
            placeholder={activeFile ? `Ask about ${activeFile.split('/').pop()}...` : "Ask a question..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            className="w-full bg-bg-primary border border-border-color rounded-lg pl-3 pr-10 py-2.5 text-xs outline-none focus:border-border-focus text-text-main font-sans placeholder-text-muted"
          />
          <button 
            onClick={() => handleSendMessage()}
            className="absolute right-2 top-2 p-1.5 bg-accent-violet hover:bg-opacity-80 rounded-md text-white transition"
          >
            <Send size={12} />
          </button>
        </div>
        <div className="text-[8px] text-text-muted mt-1 text-center font-sans">AI assistant will read active editor file content as context.</div>
      </div>
    </div>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-4.5 w-4.5 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v4m0 8v4m4-8h4M4 12h4m3.343-5.657l2.828-2.828m-8.485 8.485l2.828-2.828m8.485 8.485l-2.828-2.828M5.657 5.657l2.828 2.828" />
    </svg>
  );
}
