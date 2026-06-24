import React, { useEffect, useState } from 'react';
import { Folder, FolderOpen, FileCode, FilePlus, FolderPlus, RefreshCw, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { api } from '../../services/api';
import { useAppDispatch, useAppSelector } from '../../store';
import { openFile, setFileTree, closeFile, type FileNode } from '../../store/workspaceSlice';

interface TreeItemProps {
  node: FileNode;
  activePath: string | null;
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (path: string) => void;
  onOpenFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
}

function TreeItem({ node, activePath, expandedFolders, onToggleFolder, onOpenFile, onDeleteFile }: TreeItemProps) {
  const isExpanded = expandedFolders[node.path] || false;
  const isSelected = activePath === node.path;
  const filename = node.name;

  const getIcon = () => {
    if (node.isDirectory) {
      return isExpanded 
        ? <FolderOpen size={14} className="text-accent-violet fill-accent-violet/10 flex-shrink-0" />
        : <Folder size={14} className="text-accent-violet fill-accent-violet/10 flex-shrink-0" />;
    }
    
    // File icons based on extension
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': case 'tsx': return <FileCode size={14} className="text-[#61dafb] flex-shrink-0" />;
      case 'py': return <FileCode size={14} className="text-accent-green flex-shrink-0" />;
      case 'json': return <FileCode size={14} className="text-accent-yellow flex-shrink-0" />;
      case 'tf': return <FileCode size={14} className="text-accent-violet flex-shrink-0" />;
      case 'dockerfile': return <FileCode size={14} className="text-accent-red flex-shrink-0" />;
      default: return <FileCode size={14} className="text-text-muted flex-shrink-0" />;
    }
  };

  const handleItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.isDirectory) {
      onToggleFolder(node.path);
    } else {
      onOpenFile(node.path);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${node.name}?`)) {
      onDeleteFile(node.path);
    }
  };

  return (
    <div className="flex flex-col select-none">
      <div 
        onClick={handleItemClick}
        className={`group flex items-center justify-between px-3 py-1 cursor-pointer transition text-xs font-mono border-l-2 ${
          isSelected 
            ? 'bg-accent-cyan/8 border-accent-cyan text-text-main' 
            : 'border-transparent text-text-main hover:bg-bg-primary/25'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {node.isDirectory && (
            <span>
              {isExpanded ? <ChevronDown size={11} className="text-text-muted" /> : <ChevronRight size={11} className="text-text-muted" />}
            </span>
          )}
          {!node.isDirectory && <span className="w-[11px]" />}
          {getIcon()}
          <span className="truncate">{node.name}</span>
        </div>
        
        {/* Hover Delete Action */}
        <button 
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-border-color text-text-muted hover:text-accent-red rounded transition"
          title="Delete Item"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {node.isDirectory && isExpanded && node.children && (
        <div className="pl-3 border-l border-border-color/30 flex flex-col">
          {node.children.map((child: FileNode) => (
            <TreeItem 
              key={child.path}
              node={child}
              activePath={activePath}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onOpenFile={onOpenFile}
              onDeleteFile={onDeleteFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExplorerPanel() {
  const dispatch = useAppDispatch();
  const fileTree = useAppSelector(state => state.workspace.fileTree);
  const activeFile = useAppSelector(state => state.workspace.activeFile);
  
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    "": true, "frontend": true, "backend": true
  });
  const [loading, setLoading] = useState(false);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const data = await api.getFileTree();
      dispatch(setFileTree(data));
    } catch (e) {
      console.error("Failed to fetch files tree:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleOpenFile = (path: string) => {
    dispatch(openFile(path));
  };

  const handleDeleteFile = async (path: string) => {
    try {
      await api.deleteItem(path);
      fetchTree();
      dispatch(closeFile(path)); // Ensure open tab is cleaned up
    } catch (err) {
      alert("Failed to delete file folder. Make sure it exists and path resolves inside workspace.");
    }
  };

  const createItemPrompt = async (isDirectory: boolean) => {
    const defaultRel = activeFile ? activeFile.split('/').slice(0, -1).join('/') : '';
    const name = prompt(`Enter new ${isDirectory ? 'folder' : 'file'} name (optional directory prefix):`, defaultRel ? `${defaultRel}/` : '');
    if (!name) return;

    try {
      await api.createItem(name, isDirectory);
      fetchTree();
      if (!isDirectory) {
        dispatch(openFile(name));
      }
    } catch (err) {
      alert("Failed to create file. Ensure path is correct and relative to root.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary text-text-main overflow-y-auto">
      {/* Header Panel */}
      <div className="p-4 border-b border-border-color flex justify-between items-center bg-bg-secondary select-none">
        <h3 className="text-xs font-bold tracking-wider text-text-muted uppercase">Explorer: Workspace</h3>
        <div className="flex gap-1">
          <button 
            onClick={() => createItemPrompt(false)}
            title="New File"
            className="p-1 rounded hover:bg-border-color text-text-muted hover:text-text-main transition"
          >
            <FilePlus size={13} />
          </button>
          <button 
            onClick={() => createItemPrompt(true)}
            title="New Folder"
            className="p-1 rounded hover:bg-border-color text-text-muted hover:text-text-main transition"
          >
            <FolderPlus size={13} />
          </button>
          <button 
            onClick={fetchTree}
            title="Refresh Explorer"
            className="p-1 rounded hover:bg-border-color text-text-muted hover:text-text-main transition"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tree view root list */}
      <div className="flex-1 py-3 overflow-y-auto">
        {loading && !fileTree ? (
          <div className="text-center font-mono text-[10px] text-text-muted py-10">Loading workspace files...</div>
        ) : fileTree && fileTree.children ? (
          fileTree.children.map(child => (
            <TreeItem 
              key={child.path}
              node={child}
              activePath={activeFile}
              expandedFolders={expandedFolders}
              onToggleFolder={toggleFolder}
              onOpenFile={handleOpenFile}
              onDeleteFile={handleDeleteFile}
            />
          ))
        ) : (
          <div className="text-center italic text-text-muted text-[10px] py-10">No files found. Verify backend is running.</div>
        )}
      </div>
    </div>
  );
}
