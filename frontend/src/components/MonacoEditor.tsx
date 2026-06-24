import React, { useState, useEffect, useRef } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import { FileCode, Save, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface MonacoEditorProps {
  filePath: string;
  fontSize: number;
  autosave: boolean;
  theme: 'dark-theme' | 'light-theme';
  onCursorChange?: (line: number, column: number) => void;
}

export default function MonacoEditor({ filePath, fontSize, autosave, theme, onCursorChange }: MonacoEditorProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const editorRef = useRef<any>(null);
  const saveTimeoutRef = useRef<any>(null);

  // Determine Monaco language mode from file extension
  const getLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py': return 'python';
      case 'js': case 'jsx': return 'javascript';
      case 'ts': case 'tsx': return 'typescript';
      case 'cs': return 'csharp';
      case 'go': return 'go';
      case 'rs': return 'rust';
      case 'json': return 'json';
      case 'yaml': case 'yml': return 'yaml';
      case 'tf': return 'hcl'; // Terraform
      case 'dockerfile': return 'dockerfile';
      case 'html': return 'html';
      case 'css': return 'css';
      default: return 'plaintext';
    }
  };

  // 1. Fetch file content on path change
  useEffect(() => {
    let active = true;
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const fileContent = await api.readFile(filePath);
        if (active) {
          setContent(fileContent);
        }
      } catch (err: any) {
        if (active) {
          setError(err?.response?.data?.detail || `Failed to read file ${filePath}`);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    
    fetchContent();
    return () => { active = false; };
  }, [filePath]);

  // 2. Handle manual save
  const handleSave = async (text: string) => {
    setSaving(true);
    try {
      await api.writeFile(filePath, text);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // 3. Handle Editor change & debounced auto-save
  const handleEditorChange = (value: string | undefined) => {
    const newText = value || '';
    setContent(newText);

    if (autosave) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        handleSave(newText);
      }, 1500); // Debounce save for 1.5 seconds
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;

    // Define editor configuration options
    editor.updateOptions({
      fontSize: fontSize,
      fontFamily: "'Fira Code', 'Courier New', monospace",
      minimap: { enabled: true },
      wordWrap: 'on',
      lineHeight: 20,
      cursorBlinking: 'blink',
      tabSize: 2,
    });

    // Add manual save shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const text = editor.getValue();
      handleSave(text);
    });

    // Cursor position changed listener
    editor.onDidChangeCursorPosition((e: any) => {
      if (onCursorChange) {
        onCursorChange(e.position.lineNumber, e.position.column);
      }
    });
  };

  // Split path for breadcrumbs
  const breadcrumbs = filePath.split('/');

  return (
    <div className="flex flex-col h-full bg-bg-primary select-text">
      {/* Editor Breadcrumbs Header */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-bg-secondary border-b border-border-color text-xs text-text-muted select-none">
        <div className="flex items-center gap-1 font-mono truncate">
          <FileCode size={13} className="text-accent-cyan" />
          {breadcrumbs.map((folder, index) => (
            <React.Fragment key={index}>
              <span className="hover:text-text-main cursor-pointer">{folder}</span>
              {index < breadcrumbs.length - 1 && <ChevronRightIcon />}
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {saving ? (
            <span className="text-[10px] text-accent-cyan flex items-center gap-1 font-semibold">
              <RefreshIcon className="animate-spin" /> Saving...
            </span>
          ) : (
            <button 
              onClick={() => handleSave(content)}
              title="Save File (Ctrl+S)"
              className="text-[10px] text-text-muted hover:text-text-main flex items-center gap-0.5 transition font-semibold"
            >
              <Save size={11} /> Save
            </button>
          )}
        </div>
      </div>

      {/* Editor Main Content Area */}
      <div className="flex-1 relative bg-bg-primary overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 bg-bg-primary/95 z-10 flex items-center justify-center text-xs text-text-muted font-mono">
            <RefreshIcon className="animate-spin mr-2" /> Loading editor content...
          </div>
        ) : error ? (
          <div className="absolute inset-0 bg-bg-primary/95 z-10 flex flex-col items-center justify-center text-xs text-accent-red font-mono p-4 text-center">
            <AlertCircle size={24} className="mb-2" />
            <div className="font-semibold text-sm">Failed to open file</div>
            <div className="text-[10px] text-text-muted mt-1 max-w-md">{error}</div>
          </div>
        ) : null}

        {!error && (
          <Editor
            height="100%"
            language={getLanguage(filePath)}
            theme={theme === 'dark-theme' ? 'vs-dark' : 'light'}
            value={content}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 12, bottom: 12 }
            }}
          />
        )}
      </div>
    </div>
  );
}

function ChevronRightIcon() {
  return <span className="text-[10px] px-0.5 text-text-muted/65 font-bold">/</span>;
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-3 w-3 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 10H19.5" />
    </svg>
  );
}
